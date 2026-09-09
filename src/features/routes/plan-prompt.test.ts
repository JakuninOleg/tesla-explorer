import { describe, expect, it } from "vitest";
import {
  buildChatSystemPrompt,
  buildForceItinerarySystemPrompt,
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
  shouldForceItineraryJson,
} from "@/features/routes/plan-prompt";
import { estimateRangeMiles } from "@/features/routes/tesla-range";

describe("plan prompt builder", () => {
  it("includes anchors, range budget fact, and past approved memory", () => {
    const range = estimateRangeMiles({
      model: "Model Y",
      batteryPercent: 45,
    });

    const prompt = buildPlanUserPrompt({
      profile: {
        homeAddress: "12 Oak St, Tampa, FL",
        homeLat: 27.95,
        homeLng: -82.45,
        workAddress: "100 Office Blvd, Tampa, FL",
        workLat: 27.96,
        workLng: -82.46,
        household: "family",
        kidsCount: 2,
        aboutMe: "Dad in mid-30s",
        interests: "seafood, parks",
        teslaModel: "Model Y",
      },
      input: {
        requestPrompt: "from office home for kids then explore",
        availableHours: 3,
        batteryPercent: 45,
        startAnchor: "work",
        startOtherText: "",
      },
      range,
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

    expect(prompt).toContain("Home: 12 Oak St");
    expect(prompt).toContain("Work: 100 Office Blvd");
    expect(prompt).toContain("Start (work)");
    expect(prompt).toContain("Kids count: 2");
    expect(prompt).toContain("Dad in mid-30s");
    expect(prompt).toContain("RANGE BUDGET (FACT");
    expect(prompt).toContain("Avoid loud malls");
    expect(buildPlanSystemPrompt()).toMatch(/do not invent a different/i);
    expect(buildChatSystemPrompt()).toMatch(/JSON ONLY/i);
    expect(buildForceItinerarySystemPrompt()).toMatch(/JSON only/i);
  });
});

describe("shouldForceItineraryJson", () => {
  it("detects prose route drafts that need a JSON conversion pass", () => {
    expect(
      shouldForceItineraryJson(
        "Отличный план: китайский ресторан Fat Dragon, потом парк у озера Brushy Creek Lake Park около Domain.",
      ),
    ).toBe(true);
    expect(shouldForceItineraryJson("Сколько часов свободно?")).toBe(false);
  });
});
