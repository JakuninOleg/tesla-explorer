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
  type PlanRouteInput,
} from "@/features/routes/itinerary-schema";
import {
  buildChatSystemPrompt,
  buildDriverContextBlock,
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

  const meta = chatTripMetaSchema.safeParse({
    availableHours: body.availableHours,
    batteryPercent: body.batteryPercent,
    startAnchor: body.startAnchor ?? "home",
    startOtherText: body.startOtherText ?? "",
    startOtherLat: body.startOtherLat ?? null,
    startOtherLng: body.startOtherLng ?? null,
  });
  if (!meta.success) {
    return { ok: false, error: "invalid" };
  }

  const profile = await getProfileForCurrentUser();
  if (!profile || profile.workAddress.trim().length < 5) {
    return { ok: false, error: "no_profile" };
  }

  const range = estimateRangeMiles({
    model: profile.teslaModel,
    batteryPercent: meta.data.batteryPercent,
  });
  const pastRoutes = await loadPastRatedRoutes(session.user.id);
  const context = buildDriverContextBlock({
    profile,
    range,
    pastRoutes,
    startAnchor: meta.data.startAnchor,
    startOtherText: meta.data.startOtherText,
    batteryPercent: meta.data.batteryPercent,
    availableHours: meta.data.availableHours,
  });

  let response;
  try {
    response = await goAiChatCompletions({
      body: {
        model: process.env.GO_AI_MODEL ?? "default",
        temperature: 0.45,
        messages: [
          { role: "system", content: buildChatSystemPrompt() },
          { role: "system", content: context },
          ...turns.map((turn) => ({
            role: turn.role,
            content: turn.content,
          })),
        ],
      },
    });
  } catch {
    return {
      ok: false,
      error: "ai",
      message: "Route planning is not configured.",
    };
  }

  if (!response.ok) {
    const err = await readGoAiSafeError(response);
    return { ok: false, error: "ai", message: err.message };
  }

  let content: string | null | undefined;
  try {
    const payload = (await response.json()) as GoAiChatCompletionResponse;
    content = payload.choices?.[0]?.message?.content;
  } catch {
    return { ok: false, error: "parse" };
  }

  if (!content?.trim()) {
    return { ok: false, error: "parse" };
  }

  let itinerary;
  try {
    itinerary = parseItineraryResponse(content);
  } catch {
    const looksLikeJson = /^\s*[{\[]/.test(content.trim()) || content.includes("```");
    if (looksLikeJson && content.includes('"stops"')) {
      return { ok: false, error: "parse" };
    }
    return { ok: true, reply: content.trim() };
  }

  const plannedMiles = sumApproxDriveMiles(itinerary.stops);
  const rangeWarning = buildRangeWarning(range.budgetMiles, plannedMiles);
  const lastUser = [...turns].reverse().find((t) => t.role === "user");
  const planInput: PlanRouteInput = {
    ...meta.data,
    requestPrompt: lastUser?.content ?? itinerary.title,
    adjustNotes: undefined,
    adjustOfRouteId: undefined,
  };

  try {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(routes).values({
      id,
      userId: session.user.id,
      title: itinerary.title,
      summary: itinerary.summary,
      requestPrompt: planInput.requestPrompt,
      availableHours: planInput.availableHours,
      batteryPercent: planInput.batteryPercent,
      startAnchor: planInput.startAnchor,
      startOtherText:
        planInput.startAnchor === "other"
          ? planInput.startOtherText || null
          : null,
      startOtherLat:
        planInput.startAnchor === "other"
          ? (planInput.startOtherLat ?? null)
          : null,
      startOtherLng:
        planInput.startAnchor === "other"
          ? (planInput.startOtherLng ?? null)
          : null,
      status: "proposed",
      stopsJson: JSON.stringify(itinerary.stops),
      rangeBudgetMiles: range.budgetMiles,
      rangeWarning,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      reply: itinerary.summary,
      routeId: id,
      rangeWarning,
    };
  } catch {
    return { ok: false, error: "database" };
  }
}
