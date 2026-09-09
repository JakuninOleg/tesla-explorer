"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { routes } from "@/db/schema";
import {
  goAiChatCompletions,
  readGoAiSafeError,
} from "@/features/ai/go-ai-client";
import type { GoAiChatCompletionResponse } from "@/features/ai/go-ai-types";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import {
  chatTripMetaSchema,
  parseItineraryResponse,
  type Itinerary,
  type PlanRouteInput,
} from "@/features/routes/itinerary-schema";
import {
  buildDriverContextBlock,
  buildForceItinerarySystemPrompt,
  buildPlanSystemPrompt,
  type ChatTurn,
  type PastRouteMemory,
} from "@/features/routes/plan-prompt";
import {
  buildRangeWarning,
  estimateRangeMiles,
  sumApproxDriveMiles,
} from "@/features/routes/tesla-range";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export type ChatPlanResult =
  | {
      ok: true;
      reply: string;
      routeId?: string;
      rangeWarning?: string | null;
    }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "no_profile"
        | "invalid"
        | "ai"
        | "parse"
        | "database";
      message?: string;
    };

const PAST_ROUTE_LIMIT = 5;

async function loadPastRatedRoutes(userId: string): Promise<PastRouteMemory[]> {
  const rows = await db
    .select({
      title: routes.title,
      rating: routes.rating,
      impressionNotes: routes.impressionNotes,
      preferenceNotes: routes.preferenceNotes,
      requestPrompt: routes.requestPrompt,
    })
    .from(routes)
    .where(
      and(
        eq(routes.userId, userId),
        eq(routes.status, "approved"),
        isNotNull(routes.rating),
      ),
    )
    .orderBy(desc(routes.updatedAt))
    .limit(PAST_ROUTE_LIMIT);

  return rows.map((row) => ({
    title: row.title,
    rating: row.rating as number,
    impressionNotes: row.impressionNotes,
    preferenceNotes: row.preferenceNotes,
    requestPrompt: row.requestPrompt,
  }));
}

function normalizeTurns(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 24) {
    return null;
  }
  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      content.trim().length === 0 ||
      content.length > 4000
    ) {
      return null;
    }
    turns.push({ role, content: content.trim() });
  }
  return turns;
}

async function callGoAi(messages: Array<{ role: string; content: string }>) {
  const response = await goAiChatCompletions({
    body: {
      model: process.env.GO_AI_MODEL ?? "default",
      temperature: 0.3,
      messages: messages as Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }>,
    },
  });

  if (!response.ok) {
    const err = await readGoAiSafeError(response);
    return { ok: false as const, message: err.message };
  }

  try {
    const payload = (await response.json()) as GoAiChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      return { ok: false as const, message: "empty" };
    }
    return { ok: true as const, content: content.trim() };
  } catch {
    return { ok: false as const, message: "parse" };
  }
}

function tryParseItinerary(content: string): Itinerary | null {
  try {
    return parseItineraryResponse(content);
  } catch {
    return null;
  }
}

async function persistItinerary(options: {
  userId: string;
  itinerary: Itinerary;
  meta: PlanRouteInput;
  rangeBudgetMiles: number;
  rangeWarning: string | null;
}): Promise<{ id: string } | null> {
  try {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(routes).values({
      id,
      userId: options.userId,
      title: options.itinerary.title,
      summary: options.itinerary.summary,
      requestPrompt: options.meta.requestPrompt,
      availableHours: options.meta.availableHours,
      batteryPercent: options.meta.batteryPercent,
      startAnchor: options.meta.startAnchor,
      startOtherText:
        options.meta.startAnchor === "other"
          ? options.meta.startOtherText || null
          : null,
      startOtherLat:
        options.meta.startAnchor === "other"
          ? (options.meta.startOtherLat ?? null)
          : null,
      startOtherLng:
        options.meta.startAnchor === "other"
          ? (options.meta.startOtherLng ?? null)
          : null,
      status: "proposed",
      stopsJson: JSON.stringify(options.itinerary.stops),
      rangeBudgetMiles: options.rangeBudgetMiles,
      rangeWarning: options.rangeWarning,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  } catch {
    return null;
  }
}

export async function chatPlanAction(input: unknown): Promise<ChatPlanResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  if (!input || typeof input !== "object") {
    return { ok: false, error: "invalid" };
  }

  const body = input as Record<string, unknown>;
  const turns = normalizeTurns(body.messages);
  if (!turns) {
    return { ok: false, error: "invalid" };
  }

  const metaParsed = chatTripMetaSchema.safeParse({
    availableHours: body.availableHours,
    batteryPercent: body.batteryPercent,
    startAnchor: body.startAnchor ?? "home",
    startOtherText: body.startOtherText ?? "",
    startOtherLat: body.startOtherLat ?? null,
    startOtherLng: body.startOtherLng ?? null,
  });
  if (!metaParsed.success) {
    return { ok: false, error: "invalid" };
  }

  const profile = await getProfileForCurrentUser();
  if (!profile || profile.workAddress.trim().length < 5) {
    return { ok: false, error: "no_profile" };
  }

  const range = estimateRangeMiles({
    model: profile.teslaModel,
    batteryPercent: metaParsed.data.batteryPercent,
  });
  const pastRoutes = await loadPastRatedRoutes(session.user.id);
  const context = buildDriverContextBlock({
    profile,
    range,
    pastRoutes,
    startAnchor: metaParsed.data.startAnchor,
    startOtherText: metaParsed.data.startOtherText,
    batteryPercent: metaParsed.data.batteryPercent,
    availableHours: metaParsed.data.availableHours,
  });

  const lastUser = [...turns].reverse().find((t) => t.role === "user");
  const requestPrompt = lastUser?.content ?? "";
  if (requestPrompt.trim().length < 8) {
    return { ok: false, error: "invalid" };
  }

  // Single-shot JSON planner — conversational prose is unreliable for map handoff.
  const planMessages = [
    { role: "system", content: buildPlanSystemPrompt() },
    {
      role: "user",
      content: `${context}\nConversation:\n${turns
        .map((t) => `${t.role}: ${t.content}`)
        .join("\n")}\nRequest: ${requestPrompt}`,
    },
  ];

  let ai;
  try {
    ai = await callGoAi(planMessages);
  } catch {
    return {
      ok: false,
      error: "ai",
      message: "Route planning is not configured.",
    };
  }

  if (!ai.ok) {
    return {
      ok: false,
      error: ai.message === "parse" ? "parse" : "ai",
      message: ai.message === "empty" ? undefined : ai.message,
    };
  }

  let itinerary = tryParseItinerary(ai.content);

  if (!itinerary) {
    try {
      const forced = await callGoAi([
        { role: "system", content: buildForceItinerarySystemPrompt() },
        { role: "system", content: context },
        {
          role: "user",
          content: `Request: ${requestPrompt}\nDraft model output to convert:\n${ai.content.slice(0, 3500)}`,
        },
      ]);
      if (forced.ok) {
        itinerary = tryParseItinerary(forced.content);
      }
    } catch {
      // fall through
    }
  }

  if (!itinerary) {
    return { ok: false, error: "parse" };
  }

  const plannedMiles = sumApproxDriveMiles(itinerary.stops);
  const rangeWarning = buildRangeWarning(range.budgetMiles, plannedMiles);
  const planInput: PlanRouteInput = {
    ...metaParsed.data,
    requestPrompt,
    adjustNotes: undefined,
    adjustOfRouteId: undefined,
  };

  const saved = await persistItinerary({
    userId: session.user.id,
    itinerary,
    meta: planInput,
    rangeBudgetMiles: range.budgetMiles,
    rangeWarning,
  });

  if (!saved) {
    return { ok: false, error: "database" };
  }

  return {
    ok: true,
    reply: itinerary.summary,
    routeId: saved.id,
    rangeWarning,
  };
}
