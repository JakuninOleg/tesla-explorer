import { describe, expect, it } from "vitest";
import {
  chatTripMetaSchema,
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
    expect(parsed.stops[0]?.role).toBe("explore");
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

  it("accepts return-home stops with zero dwell minutes", () => {
    const itinerary = parseItineraryResponse(
      JSON.stringify({
        title: "Kids food and park",
        summary: "Short family loop ending at home.",
        stops: [
          {
            name: "Pease Park",
            kind: "activity",
            role: "must",
            reason: "Playground for preschoolers.",
            approxMinutes: 65,
            approxDriveMiles: 11,
            lat: 30.2858,
            lng: -97.7523,
          },
          {
            name: "Home",
            kind: "anchor",
            role: "must",
            reason: "Return home.",
            approxMinutes: 0,
            approxDriveMiles: 9,
          },
        ],
      }),
    );

    expect(itinerary.stops.at(-1)?.approxMinutes).toBe(0);
    expect(itinerary.stops.at(-1)?.kind).toBe("anchor");
  });

  it("normalizes alternate LLM itinerary[] shapes into stops", () => {
    const itinerary = parseItineraryResponse(
      JSON.stringify({
        title: "Chinese Lunch & Lakeside Walk with Kids",
        vehicle: { model: "Tesla Model Y" },
        itinerary: [
          {
            step: 1,
            type: "origin",
            name: "Home",
            coordinates: { latitude: 30.435, longitude: -97.794 },
            dwell_time_minutes: 0,
          },
          {
            step: 2,
            type: "dining",
            name: "Din Ho Chinese BBQ",
            notes: "Kid-friendly Cantonese BBQ",
            coordinates: { latitude: 30.3626, longitude: -97.7145 },
            drive_from_previous: { distance_miles: 7.5 },
            dwell_time_minutes: 50,
          },
          {
            step: 3,
            type: "activity",
            name: "Brushy Creek Lake Park",
            notes: "Lakeside trail",
            coordinates: { latitude: 30.5098, longitude: -97.7554 },
            drive_from_previous: { distance_miles: 11 },
            dwell_time_minutes: 60,
          },
        ],
      }),
    );

    expect(itinerary.stops).toHaveLength(3);
    expect(itinerary.stops[0]?.kind).toBe("anchor");
    expect(itinerary.stops[1]?.kind).toBe("food");
    expect(itinerary.stops[1]?.lat).toBeCloseTo(30.3626, 3);
    expect(itinerary.stops[1]?.approxDriveMiles).toBe(7.5);
    expect(itinerary.summary.length).toBeGreaterThan(5);
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
        startAnchor: "home",
      }).availableHours,
    ).toBe(3);
  });

  it("validates chat trip meta without picking refined schema", () => {
    expect(
      chatTripMetaSchema.parse({
        availableHours: 3,
        batteryPercent: 70,
        startAnchor: "work",
      }).startAnchor,
    ).toBe("work");
  });

  it("requires other address when start is other", () => {
    const result = planRouteInputSchema.safeParse({
      requestPrompt: "Something chill near the water",
      availableHours: 3,
      batteryPercent: 55,
      startAnchor: "other",
      startOtherText: "",
    });
    expect(result.success).toBe(false);
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
