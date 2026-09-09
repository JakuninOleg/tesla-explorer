import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export const E2E_USER_EMAIL = "e2e-human-journey@tesla-explorer.local";

export type SeededE2ESession = {
  userId: string;
  sessionToken: string;
};

function sql() {
  const url = process.env.DATABASE_URL ?? process.env.AUTH_DRIZZLE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required for E2E seed");
  }
  if (process.env.ALLOW_E2E_DB_SEED !== "1" && process.env.CI) {
    throw new Error("Set ALLOW_E2E_DB_SEED=1 to seed sessions in CI");
  }
  return neon(url);
}

/** Inserts (or refreshes) a DB session for Playwright — no Google OAuth. */
export async function seedE2ESession(): Promise<SeededE2ESession> {
  const db = sql();

  const existing = await db`
    SELECT id FROM "user" WHERE email = ${E2E_USER_EMAIL} LIMIT 1
  `;

  let userId = (existing[0] as { id?: string } | undefined)?.id;
  if (!userId) {
    userId = randomUUID();
    await db`
      INSERT INTO "user" (id, name, email, "emailVerified")
      VALUES (${userId}, ${"E2E Driver"}, ${E2E_USER_EMAIL}, ${new Date()})
    `;
  }

  await db`
    INSERT INTO profile (
      "userId",
      "homeAddress", "homeLat", "homeLng",
      "workAddress", "workLat", "workLng",
      household, "kidsCount", "aboutMe", interests, "teslaModel",
      "createdAt", "updatedAt"
    ) VALUES (
      ${userId},
      ${"12301 Speckled Trout Dr, Austin, TX 78750"}, ${30.435}, ${-97.794},
      ${"11410 Century Oaks Terrace, Austin, TX 78758"}, ${30.402}, ${-97.726},
      ${"family"}, ${2}, ${"Dad — E2E fixture"}, ${"food parks water"}, ${"Model Y"},
      ${new Date()}, ${new Date()}
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "homeAddress" = EXCLUDED."homeAddress",
      "homeLat" = EXCLUDED."homeLat",
      "homeLng" = EXCLUDED."homeLng",
      "workAddress" = EXCLUDED."workAddress",
      "workLat" = EXCLUDED."workLat",
      "workLng" = EXCLUDED."workLng",
      household = EXCLUDED.household,
      "kidsCount" = EXCLUDED."kidsCount",
      "aboutMe" = EXCLUDED."aboutMe",
      interests = EXCLUDED.interests,
      "teslaModel" = EXCLUDED."teslaModel",
      "updatedAt" = EXCLUDED."updatedAt"
  `;

  await db`DELETE FROM session WHERE "userId" = ${userId}`;

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db`
    INSERT INTO session ("sessionToken", "userId", expires)
    VALUES (${sessionToken}, ${userId}, ${expires})
  `;

  return { userId, sessionToken };
}
