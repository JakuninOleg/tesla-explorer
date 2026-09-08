import { describe, expect, it } from "vitest";
import { buildStraightLineGeometry, stopsWithCoordinates } from "@/features/map/route-geometry";
import { buildPlaceContextLinks } from "@/features/places/place-links";

describe("demo-critical path helpers", () => {
  it("can map a multi-stop plan and open place context", () => {
    const stops = [
      {
        name: "Office",
        kind: "anchor" as const,
        role: "must" as const,
        reason: "Start",
        approxMinutes: 5,
        lat: 27.95,
        lng: -82.46,
      },
      {
        name: "Home",
        kind: "anchor" as const,
        role: "must" as const,
        reason: "Kids",
        approxMinutes: 15,
        lat: 27.94,
        lng: -82.45,
      },
      {
        name: "Pier",
        kind: "viewpoint" as const,
        role: "explore" as const,
        reason: "Sunset",
        approxMinutes: 40,
        lat: 27.93,
        lng: -82.44,
      },
    ];

    const mapped = stopsWithCoordinates(stops);
    expect(mapped).toHaveLength(3);
    expect(buildStraightLineGeometry(mapped)?.coordinates).toHaveLength(3);
    expect(buildPlaceContextLinks(stops[2]!).youtubeUrl).toContain("youtube.com");
  });
});
