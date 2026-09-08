import { describe, expect, it } from "vitest";
import {
  buildStraightLineGeometry,
  pointAlongLine,
  stopsWithCoordinates,
} from "@/features/map/route-geometry";

describe("route geometry", () => {
  it("keeps only stops with coordinates", () => {
    const mapped = stopsWithCoordinates([
      {
        name: "A",
        kind: "anchor",
        role: "must",
        reason: "start",
        approxMinutes: 10,
        lat: 27.9,
        lng: -82.4,
      },
      {
        name: "B",
        kind: "food",
        role: "explore",
        reason: "eat",
        approxMinutes: 40,
      },
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.lngLat).toEqual([-82.4, 27.9]);
  });

  it("builds a straight line and samples along it", () => {
    const mapped = [
      {
        name: "A",
        kind: "anchor",
        role: "must",
        listIndex: 0,
        lngLat: [-82.5, 27.9] as [number, number],
      },
      {
        name: "B",
        kind: "food",
        role: "explore",
        listIndex: 1,
        lngLat: [-82.4, 28.0] as [number, number],
      },
    ];
    const line = buildStraightLineGeometry(mapped);
    expect(line?.coordinates).toHaveLength(2);
    const mid = pointAlongLine(line!.coordinates as [number, number][], 0.5);
    expect(mid?.[0]).toBeCloseTo(-82.45, 2);
    expect(mid?.[1]).toBeCloseTo(27.95, 2);
  });
});
