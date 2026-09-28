import { describe, expect, it } from "vitest";
import { anchorStops, DEFAULT_START_ANCHOR } from "./home-map-state";

describe("home-first map", () => {
  it("starts at home, not work or a demonstration city", () => {
    expect(DEFAULT_START_ANCHOR).toBe("home");
    expect(anchorStops(30.2, -97.7, "Home")[0]?.lngLat).toEqual([-97.7, 30.2]);
  });
  it("does not invent coordinates for incomplete or invalid profiles", () => {
    for (const [lat, lng] of [[null, null], [30, null], [NaN, 10], [91, 10], [30, 181], [Infinity, 1]]) {
      expect(anchorStops(lat, lng, "Home")).toEqual([]);
    }
    expect(anchorStops(0, 0, "Home")).toHaveLength(1);
  });
});
