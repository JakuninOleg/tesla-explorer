import { describe, expect, it } from "vitest";
import {
  cinemaPlaybackDurationMs,
  cinemaPlaybackMsAtRate,
  CINEMA_FOLLOW,
  CINEMA_PLAYBACK_MAX_MS,
  CINEMA_PLAYBACK_MIN_MS,
  playbackProgress,
  playbackTime,
  orderedStopProgress,
} from "@/features/map/cinema-playback";

describe("player clock", () => {
  it("advances, resumes and applies speed without jumping back", () => {
    expect(playbackProgress(0, 1000, 10000, 1)).toBe(0.1);
    expect(playbackProgress(0.4, 1000, 10000, 2)).toBeCloseTo(0.6);
    expect(playbackProgress(0, 0, 10000, 1)).toBe(0);
    expect(playbackProgress(0.9, 10000, 10000, 4)).toBe(1);
    expect(playbackTime(65000)).toBe("1:05");
  });
  it("treats return home as the end, not the identical starting point", () => {
    const stops = [0, 1, 2].map((index) => ({ name: "Stop", kind: "anchor", role: "must", listIndex: index, lngLat: (index === 1 ? [1, 1] : [0, 0]) as [number, number] }));
    const progress = orderedStopProgress([[0, 0], [1, 1], [0, 0]], stops);
    expect(progress.map((stop) => stop.at)).toEqual([0, 0.5, 1]);
  });
  it("finds a repeated intermediate stop on the remaining route", () => {
    const coords: [number, number][] = [[0, 0], [1, 0], [2, 0], [1, 0], [0, 0]];
    const stops = coords.map((lngLat, listIndex) => ({name: "Stop", kind: "anchor", role: "must", lngLat, listIndex}));
    expect(orderedStopProgress(coords, stops).map((stop) => stop.at)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

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

describe("cinemaPlaybackMsAtRate", () => {
  it("shortens duration at 2× and lengthens at 0.5×", () => {
    const line = {
      type: "LineString" as const,
      coordinates: [
        [-97.8, 30.4],
        [-97.5, 30.4],
        [-97.2, 30.4],
        [-96.9, 30.4],
      ],
    };
    const base = cinemaPlaybackDurationMs(line);
    expect(cinemaPlaybackMsAtRate(line, 2)).toBe(Math.round(base / 2));
    expect(cinemaPlaybackMsAtRate(line, 0.5)).toBe(Math.round(base / 0.5));
  });
});

describe("CINEMA_FOLLOW", () => {
  it("keeps a close chase zoom (not city overview)", () => {
    expect(CINEMA_FOLLOW.zoom).toBeGreaterThanOrEqual(18);
    expect(CINEMA_FOLLOW.behindMeters).toBeLessThanOrEqual(20);
  });
});
