import { describe, expect, it } from "vitest";
import {
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
} from "@/features/routes/plan-prompt";

describe("plan prompt builder", () => {
  it("includes profile, request, and past route memory", () => {
    const prompt = buildPlanUserPrompt({
      profile: {
        homePlace: "Tampa, FL",
        household: "family",
        interests: "seafood, parks",
        teslaModel: "Model Y",
        batteryPercent: 70,
      },
      requestPrompt: "Quiet sunset drive under 3 hours",
      availableHours: 3,
      batteryPercent: 45,
      pastRoutes: [
        {
          title: "Bay loop",
          rating: 5,
          impressionNotes: "Kids loved the park",
          preferenceNotes: "Avoid loud malls",
          requestPrompt: "Family afternoon",
        },
      ],
    });

    expect(prompt).toContain("Tampa, FL");
    expect(prompt).toContain("Battery now: 45%");
    expect(prompt).toContain("Quiet sunset drive");
    expect(prompt).toContain('rating 5/5');
    expect(prompt).toContain("Avoid loud malls");
  });

  it("notes when there are no past ratings", () => {
    const prompt = buildPlanUserPrompt({
      profile: {
        homePlace: "Austin, TX",
        household: "solo",
        interests: "coffee",
        teslaModel: "Model 3",
        batteryPercent: 80,
      },
      requestPrompt: "Coffee and a viewpoint",
      availableHours: 2,
      batteryPercent: 80,
      pastRoutes: [],
    });

    expect(prompt).toContain("Past rated routes: none yet.");
  });

  it("asks for JSON-only itinerary shape in the system prompt", () => {
    expect(buildPlanSystemPrompt()).toMatch(/JSON only/i);
    expect(buildPlanSystemPrompt()).toMatch(/stops/);
  });
});
