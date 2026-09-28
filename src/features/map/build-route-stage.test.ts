import { describe, expect, it } from "vitest";
import { buildRouteStage } from "@/features/map/build-route-stage";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

const austinStops: ItineraryStop[] = [
  {
    name: "Home",
    kind: "anchor",
    role: "must",
    approxMinutes: 0,
    approxDriveMiles: 0,
    reason: "Start",
    lat: 30.435,
    lng: -97.794,
  },
  {
    name: "Lake",
    kind: "scenic",
    role: "explore",
    approxMinutes: 40,
    approxDriveMiles: 8,
    reason: "Water walk",
    lat: 30.402,
    lng: -97.726,
  },
];

describe("buildRouteStage", () => {
  it("keeps stops but disables cinema when no driving geometry is available", async () => {
    const stage = await buildRouteStage(austinStops, {
      token: "",
      fetchImpl: async () => new Response("no", { status: 500 }),
    });
    expect(stage.mapped).toHaveLength(2);
    expect(stage.canCinema).toBe(false);
    expect(stage.line).toBeNull();
    expect(stage.startPose).toBeNull();
    expect(stage.midPose).toBeNull();
  });
});
