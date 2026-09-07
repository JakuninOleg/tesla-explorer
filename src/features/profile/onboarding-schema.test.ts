import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/features/profile/onboarding-schema";

describe("onboardingSchema", () => {
  it("accepts a valid profile payload", () => {
    const parsed = onboardingSchema.parse({
      homePlace: "Sarasota, FL",
      household: "family",
      interests: "seafood, beaches, short hikes",
      teslaModel: "Model Y",
      batteryPercent: 62,
    });

    expect(parsed.homePlace).toBe("Sarasota, FL");
    expect(parsed.batteryPercent).toBe(62);
  });

  it("rejects empty home and out-of-range battery", () => {
    const result = onboardingSchema.safeParse({
      homePlace: " ",
      household: "solo",
      interests: "coffee",
      teslaModel: "Model 3",
      batteryPercent: 140,
    });

    expect(result.success).toBe(false);
  });
});
