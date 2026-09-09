"use server";

import { and, desc, eq, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { routes, type RouteStatus, type StartAnchor } from "@/db/schema";
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
  routeIdSchema,
  type ItineraryStop,
  type PlanRouteInput,
} from "@/features/routes/itinerary-schema";
import {
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
  type PastRouteMemory,
} from "@/features/routes/plan-prompt";
import {
  buildRangeWarning,
  estimateRangeMiles,
  sumApproxDriveMiles,
} from "@/features/routes/tesla-range";
import { isLocale, type Locale } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export type PlanRouteResult =
  | { ok: true; id: string; rangeWarning: string | null }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "no_profile"
        | "invalid"
        | "ai"
        | "parse"
        | "database"
        | "not_found";
      message?: string;
    };

export type RateRouteResult =
  | { ok: true }
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "not_found" | "database" | "not_approved";
    };

export type StatusActionResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "not_found" | "database" };

export type RouteListItem = {
  id: string;
  title: string;
  status: RouteStatus;
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
  startAnchor: StartAnchor;
  startOtherText: string | null;
  startOtherLat: number | null;
  startOtherLng: number | null;
  status: RouteStatus;
  adjustNotes: string | null;
  rangeBudgetMiles: number | null;
  rangeWarning: string | null;
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

async function generateItinerary(options: {
  profile: NonNullable<Awaited<ReturnType<typeof getProfileForCurrentUser>>>;
  input: PlanRouteInput;
  userId: string;
  locale: Locale;
}) {
  const range = estimateRangeMiles({
    model: options.profile.teslaModel,
    batteryPercent: options.input.batteryPercent,
  });

  const pastRoutes = await loadPastRatedRoutes(options.userId);

  const response = await goAiChatCompletions({
    body: {
      model: process.env.GO_AI_MODEL ?? "default",
      temperature: 0.4,
      messages: [
        { role: "system", content: buildPlanSystemPrompt(options.locale) },
        {
          role: "user",
          content: buildPlanUserPrompt({
            profile: options.profile,
            input: options.input,
            range,
            pastRoutes,
          }),
        },
      ],
    },
  });

  if (!response.ok) {
    const err = await readGoAiSafeError(response);
    return { ok: false as const, error: "ai" as const, message: err.message };
  }

  let content: string | null | undefined;
  try {
    const body = (await response.json()) as GoAiChatCompletionResponse;
    content = body.choices?.[0]?.message?.content;
  } catch {
    return { ok: false as const, error: "parse" as const };
  }

  if (!content) {
    return { ok: false as const, error: "parse" as const };
  }

  try {
    const itinerary = parseItineraryResponse(content);
    const plannedMiles = sumApproxDriveMiles(itinerary.stops);
    const rangeWarning = buildRangeWarning(range.budgetMiles, plannedMiles);
    return {
      ok: true as const,
      itinerary,
      range,
      rangeWarning,
    };
  } catch {
    return { ok: false as const, error: "parse" as const };
  }
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

  if (!profile.workAddress.trim() || profile.workAddress.trim().length < 5) {
    return { ok: false, error: "no_profile" };
  }

  const adjustId = parsed.data.adjustOfRouteId;
  let preservedOther:
    | {
        startOtherText: string | null;
        startOtherLat: number | null;
        startOtherLng: number | null;
      }
    | null = null;

  if (adjustId) {
    try {
      const existing = await db
        .select({
          id: routes.id,
          status: routes.status,
          startOtherLat: routes.startOtherLat,
          startOtherLng: routes.startOtherLng,
          startOtherText: routes.startOtherText,
        })
        .from(routes)
        .where(and(eq(routes.id, adjustId), eq(routes.userId, session.user.id)))
        .limit(1);

      const current = existing[0];
      if (!current) {
        return { ok: false, error: "not_found" };
      }
      if (current.status !== "proposed") {
        return { ok: false, error: "invalid" };
      }

      preservedOther = {
        startOtherText: current.startOtherText,
        startOtherLat: current.startOtherLat,
        startOtherLng: current.startOtherLng,
      };
    } catch {
      return { ok: false, error: "database" };
    }
  }

  let generated;
  try {
    const localeRaw = await getLocale();
    const locale: Locale = isLocale(localeRaw) ? localeRaw : "en";
    generated = await generateItinerary({
      profile,
      input: parsed.data,
      userId: session.user.id,
      locale,
    });
  } catch {
    return {
      ok: false,
      error: "ai",
      message: "Route planning is not configured.",
    };
  }

  if (!generated.ok) {
    return generated;
  }

  const now = new Date();

  try {
    if (adjustId && preservedOther) {
      const otherLat =
        parsed.data.startOtherLat ?? preservedOther.startOtherLat ?? null;
      const otherLng =
        parsed.data.startOtherLng ?? preservedOther.startOtherLng ?? null;
      const otherText =
        parsed.data.startOtherText?.trim() ||
        preservedOther.startOtherText ||
        null;

      const updated = await db
        .update(routes)
        .set({
          title: generated.itinerary.title,
          summary: generated.itinerary.summary,
          requestPrompt: parsed.data.requestPrompt,
          availableHours: parsed.data.availableHours,
          batteryPercent: parsed.data.batteryPercent,
          startAnchor: parsed.data.startAnchor,
          startOtherText:
            parsed.data.startAnchor === "other" ? otherText : null,
          startOtherLat: parsed.data.startAnchor === "other" ? otherLat : null,
          startOtherLng: parsed.data.startAnchor === "other" ? otherLng : null,
          status: "proposed",
          stopsJson: JSON.stringify(generated.itinerary.stops),
          adjustNotes: parsed.data.adjustNotes?.trim() || null,
          rangeBudgetMiles: generated.range.budgetMiles,
          rangeWarning: generated.rangeWarning,
          updatedAt: now,
        })
        .where(and(eq(routes.id, adjustId), eq(routes.userId, session.user.id)))
        .returning({ id: routes.id });

      if (updated.length === 0) {
        return { ok: false, error: "not_found" };
      }

      return {
        ok: true,
        id: updated[0]!.id,
        rangeWarning: generated.rangeWarning,
      };
    }

    const id = crypto.randomUUID();
    await db.insert(routes).values({
      id,
      userId: session.user.id,
      title: generated.itinerary.title,
      summary: generated.itinerary.summary,
      requestPrompt: parsed.data.requestPrompt,
      availableHours: parsed.data.availableHours,
      batteryPercent: parsed.data.batteryPercent,
      startAnchor: parsed.data.startAnchor,
      startOtherText:
        parsed.data.startAnchor === "other"
          ? parsed.data.startOtherText || null
          : null,
      startOtherLat:
        parsed.data.startAnchor === "other"
          ? (parsed.data.startOtherLat ?? null)
          : null,
      startOtherLng:
        parsed.data.startAnchor === "other"
          ? (parsed.data.startOtherLng ?? null)
          : null,
      status: "proposed",
      stopsJson: JSON.stringify(generated.itinerary.stops),
      adjustNotes: parsed.data.adjustNotes?.trim() || null,
      rangeBudgetMiles: generated.range.budgetMiles,
      rangeWarning: generated.rangeWarning,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true, id, rangeWarning: generated.rangeWarning };
  } catch {
    return { ok: false, error: "database" };
  }
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
        status: routes.status,
        rating: routes.rating,
        createdAt: routes.createdAt,
        availableHours: routes.availableHours,
      })
      .from(routes)
      .where(eq(routes.userId, session.user.id))
      .orderBy(desc(routes.createdAt))
      .limit(40);

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
      const rawStops = JSON.parse(row.stopsJson) as ItineraryStop[];
      stops = rawStops.map((stop) => ({
        ...stop,
        role: stop.role ?? "explore",
      }));
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
      startAnchor: row.startAnchor,
      startOtherText: row.startOtherText,
      startOtherLat: row.startOtherLat,
      startOtherLng: row.startOtherLng,
      status: row.status,
      adjustNotes: row.adjustNotes,
      rangeBudgetMiles: row.rangeBudgetMiles,
      rangeWarning: row.rangeWarning,
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

export async function approveRouteAction(
  input: unknown,
): Promise<StatusActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = routeIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const updated = await db
      .update(routes)
      .set({ status: "approved", updatedAt: new Date() })
      .where(
        and(
          eq(routes.id, parsed.data.routeId),
          eq(routes.userId, session.user.id),
          eq(routes.status, "proposed"),
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

export async function declineRouteAction(
  input: unknown,
): Promise<StatusActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = routeIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  try {
    const updated = await db
      .update(routes)
      .set({ status: "declined", updatedAt: new Date() })
      .where(
        and(
          eq(routes.id, parsed.data.routeId),
          eq(routes.userId, session.user.id),
          eq(routes.status, "proposed"),
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
    const existing = await db
      .select({ status: routes.status })
      .from(routes)
      .where(
        and(
          eq(routes.id, parsed.data.routeId),
          eq(routes.userId, session.user.id),
        ),
      )
      .limit(1);

    const row = existing[0];
    if (!row) {
      return { ok: false, error: "not_found" };
    }
    if (row.status !== "approved") {
      return { ok: false, error: "not_approved" };
    }

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
