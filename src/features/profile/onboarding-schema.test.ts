import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/features/profile/onboarding-schema";

describe("onboardingSchema", () => {
  it("accepts home and work addresses without battery", () => {
    const parsed = onboardingSchema.parse({
      homeAddress: "123 Palm Ave, Sarasota, FL",
      homeLat: 27.3,
      homeLng: -82.5,
      workAddress: "500 Main St, Tampa, FL",
      household: "family",
      interests: "seafood, beaches, short hikes",
      teslaModel: "Model Y",
    });

    expect(parsed.homeAddress).toContain("Sarasota");
    expect(parsed.workAddress).toContain("Tampa");
    expect(parsed).not.toHaveProperty("batteryPercent");
  });

  it("rejects short addresses", () => {
    const result = onboardingSchema.safeParse({
      homeAddress: "x",
      workAddress: "y",
      household: "solo",
      interests: "coffee",
      teslaModel: "Model 3",
    });

    expect(result.success).toBe(false);
  });
});
