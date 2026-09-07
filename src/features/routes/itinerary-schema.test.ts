import { describe, expect, it } from "vitest";
import {
  extractJsonObject,
  itinerarySchema,
  parseItineraryResponse,
  planRouteInputSchema,
  rateRouteInputSchema,
} from "@/features/routes/itinerary-schema";

describe("itinerary schema", () => {
  it("accepts a valid itinerary payload", () => {
    const parsed = itinerarySchema.parse({
      title: "Gulf Coast evening",
      summary: "Short scenic loop with dinner and a charge stop.",
      stops: [
        {
          name: "Pier overlook",
          kind: "viewpoint",
          reason: "Golden hour views close to home.",
          approxMinutes: 40,
          lat: 27.9,
          lng: -82.4,
        },
        {
          name: "Local seafood",
          kind: "food",
          reason: "Casual dinner matching family interests.",
          approxMinutes: 75,
        },
      ],
    });

    expect(parsed.stops).toHaveLength(2);
    expect(parsed.title).toContain("Gulf");
  });

  it("parses JSON from fenced model output", () => {
    const itinerary = parseItineraryResponse(`Here you go:
\`\`\`json
{"title":"Loop","summary":"A calm loop.","stops":[{"name":"Park","kind":"scenic","reason":"Trees and quiet.","approxMinutes":30}]}
\`\`\``);

    expect(itinerary.title).toBe("Loop");
    expect(itinerary.stops[0]?.kind).toBe("scenic");
  });

  it("extractJsonObject rejects text without braces", () => {
    expect(() => extractJsonObject("no json here")).toThrow(/JSON object/);
  });
});

describe("plan and rate input schemas", () => {
  it("validates plan composer input", () => {
    expect(
      planRouteInputSchema.parse({
        requestPrompt: "Something chill near the water",
        availableHours: 3,
        batteryPercent: 55,
      }).availableHours,
    ).toBe(3);
  });

  it("validates rating payload", () => {
    expect(
      rateRouteInputSchema.parse({
        routeId: "550e8400-e29b-41d4-a716-446655440000",
        rating: 4,
        impressionNotes: "Loved the pier",
        preferenceNotes: "More food stops",
      }).rating,
    ).toBe(4);
  });
});
