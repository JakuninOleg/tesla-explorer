"use server";

import { and, desc, eq, isNotNull } from "drizzle-orm";
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
  parseItineraryResponse,
  planRouteInputSchema,
  rateRouteInputSchema,
  type ItineraryStop,
} from "@/features/routes/itinerary-schema";
import {
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
  type PastRouteMemory,
} from "@/features/routes/plan-prompt";

export type PlanRouteResult =
  | { ok: true; id: string }
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

export type RateRouteResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "not_found" | "database" };

export type RouteListItem = {
  id: string;
  title: string;
  rating: number | null;
  createdAt: Date;
  availableHours: number;
};

export type RouteDetail = {
  id: string;
  title: string;
  summary: string | null;
  requestPrompt: string;
  availableHours: number;
  batteryPercent: number;
  stops: ItineraryStop[];
  rating: number | null;
  impressionNotes: string | null;
  preferenceNotes: string | null;
  createdAt: Date;
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
    .where(and(eq(routes.userId, userId), isNotNull(routes.rating)))
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

export async function planRouteAction(
  input: unknown,
): Promise<PlanRouteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = planRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const profile = await getProfileForCurrentUser();
  if (!profile) {
    return { ok: false, error: "no_profile" };
  }

  let pastRoutes: PastRouteMemory[] = [];
  try {
    pastRoutes = await loadPastRatedRoutes(session.user.id);
  } catch {
    return { ok: false, error: "database" };
  }

  let response: Response;
  try {
    response = await goAiChatCompletions({
      body: {
        model: process.env.GO_AI_MODEL ?? "default",
        temperature: 0.4,
        messages: [
          { role: "system", content: buildPlanSystemPrompt() },
          {
            role: "user",
            content: buildPlanUserPrompt({
              profile,
              requestPrompt: parsed.data.requestPrompt,
              availableHours: parsed.data.availableHours,
              batteryPercent: parsed.data.batteryPercent,
              pastRoutes,
            }),
          },
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
    const body = (await response.json()) as GoAiChatCompletionResponse;
    content = body.choices?.[0]?.message?.content;
  } catch {
    return { ok: false, error: "parse" };
  }

  if (!content) {
    return { ok: false, error: "parse" };
  }

  let itinerary;
  try {
    itinerary = parseItineraryResponse(content);
  } catch {
    return { ok: false, error: "parse" };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  try {
    await db.insert(routes).values({
      id,
      userId: session.user.id,
      title: itinerary.title,
      summary: itinerary.summary,
      requestPrompt: parsed.data.requestPrompt,
      availableHours: parsed.data.availableHours,
      batteryPercent: parsed.data.batteryPercent,
      stopsJson: JSON.stringify(itinerary.stops),
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return { ok: false, error: "database" };
  }

  return { ok: true, id };
}

export async function listRoutesForCurrentUser(): Promise<RouteListItem[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: routes.id,
        title: routes.title,
        rating: routes.rating,
        createdAt: routes.createdAt,
        availableHours: routes.availableHours,
      })
      .from(routes)
      .where(eq(routes.userId, session.user.id))
      .orderBy(desc(routes.createdAt))
      .limit(30);

    return rows;
  } catch {
    return [];
  }
}

export async function getRouteForCurrentUser(
  routeId: string,
): Promise<RouteDetail | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(routes)
      .where(and(eq(routes.id, routeId), eq(routes.userId, session.user.id)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    let stops: ItineraryStop[] = [];
    try {
      stops = JSON.parse(row.stopsJson) as ItineraryStop[];
    } catch {
      stops = [];
    }

    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      requestPrompt: row.requestPrompt,
      availableHours: row.availableHours,
      batteryPercent: row.batteryPercent,
      stops,
      rating: row.rating,
      impressionNotes: row.impressionNotes,
      preferenceNotes: row.preferenceNotes,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

export async function rateRouteAction(
  input: unknown,
): Promise<RateRouteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = rateRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const updated = await db
      .update(routes)
      .set({
        rating: parsed.data.rating,
        impressionNotes: parsed.data.impressionNotes || null,
        preferenceNotes: parsed.data.preferenceNotes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(routes.id, parsed.data.routeId),
          eq(routes.userId, session.user.id),
        ),
      )
      .returning({ id: routes.id });

    if (updated.length === 0) {
      return { ok: false, error: "not_found" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "database" };
  }
}
