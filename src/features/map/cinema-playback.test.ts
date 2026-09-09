import { describe, expect, it } from "vitest";
import {
  cinemaPlaybackDurationMs,
  CINEMA_FOLLOW,
  CINEMA_PLAYBACK_MAX_MS,
  CINEMA_PLAYBACK_MIN_MS,
} from "@/features/map/cinema-playback";

describe("cinemaPlaybackDurationMs", () => {
  it("clamps short routes to a leisurely minimum", () => {
    const ms = cinemaPlaybackDurationMs({
      type: "LineString",
      coordinates: [
        [-97.79, 30.43],
        [-97.78, 30.42],
      ],
    });
    expect(ms).toBe(CINEMA_PLAYBACK_MIN_MS);
  });

  it("scales with distance but stays under the max", () => {
    const ms = cinemaPlaybackDurationMs({
      type: "LineString",
      coordinates: [
        [-97.8, 30.4],
        [-97.5, 30.4],
        [-97.2, 30.4],
        [-96.9, 30.4],
      ],
    });
    expect(ms).toBeGreaterThan(CINEMA_PLAYBACK_MIN_MS);
    expect(ms).toBeLessThanOrEqual(CINEMA_PLAYBACK_MAX_MS);
  });
});

describe("CINEMA_FOLLOW", () => {
  it("keeps a close chase zoom (not city overview)", () => {
    expect(CINEMA_FOLLOW.zoom).toBeGreaterThanOrEqual(18);
    expect(CINEMA_FOLLOW.behindMeters).toBeLessThanOrEqual(20);
  });
});
