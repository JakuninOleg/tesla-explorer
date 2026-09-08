"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/features/profile/onboarding-schema";

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "database" };

function normalizeCoord(
  value: number | null | undefined,
): number | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  return value;
}

export async function saveProfileAction(
  input: unknown,
): Promise<SaveProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const data: OnboardingInput = parsed.data;
  const now = new Date();
  const homeLat = normalizeCoord(data.homeLat ?? null);
  const homeLng = normalizeCoord(data.homeLng ?? null);
  const workLat = normalizeCoord(data.workLat ?? null);
  const workLng = normalizeCoord(data.workLng ?? null);

  try {
    await db
      .insert(profiles)
      .values({
        userId: session.user.id,
        homeAddress: data.homeAddress,
        homeLat,
        homeLng,
        workAddress: data.workAddress,
        workLat,
        workLng,
        household: data.household,
        interests: data.interests,
        teslaModel: data.teslaModel,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          homeAddress: data.homeAddress,
          homeLat,
          homeLng,
          workAddress: data.workAddress,
          workLat,
          workLng,
          household: data.household,
          interests: data.interests,
          teslaModel: data.teslaModel,
          updatedAt: now,
        },
      });

    return { ok: true };
  } catch {
    return { ok: false, error: "database" };
  }
}

export async function getProfileForCurrentUser(): Promise<OnboardingInput | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const rows = await db
      .select({
        homeAddress: profiles.homeAddress,
        homeLat: profiles.homeLat,
        homeLng: profiles.homeLng,
        workAddress: profiles.workAddress,
        workLat: profiles.workLat,
        workLng: profiles.workLng,
        household: profiles.household,
        interests: profiles.interests,
        teslaModel: profiles.teslaModel,
      })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      homeAddress: row.homeAddress,
      homeLat: row.homeLat,
      homeLng: row.homeLng,
      workAddress: row.workAddress,
      workLat: row.workLat,
      workLng: row.workLng,
      household: row.household,
      interests: row.interests,
      teslaModel: row.teslaModel,
    };
  } catch {
    return null;
  }
}
