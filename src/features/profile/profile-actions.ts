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

  try {
    await db
      .insert(profiles)
      .values({
        userId: session.user.id,
        homePlace: data.homePlace,
        household: data.household,
        interests: data.interests,
        teslaModel: data.teslaModel,
        batteryPercent: data.batteryPercent,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          homePlace: data.homePlace,
          household: data.household,
          interests: data.interests,
          teslaModel: data.teslaModel,
          batteryPercent: data.batteryPercent,
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
        homePlace: profiles.homePlace,
        household: profiles.household,
        interests: profiles.interests,
        teslaModel: profiles.teslaModel,
        batteryPercent: profiles.batteryPercent,
      })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}
