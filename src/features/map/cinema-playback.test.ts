import { describe, expect, it } from "vitest";
import {
  chaseCameraPlacement,
  cinemaPlaybackDurationMs,
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

describe("chaseCameraPlacement", () => {
  it("puts the camera behind the car and looks ahead along heading", () => {
    // Heading 0 = north; camera should be south of the car.
    const pose = { lngLat: [-97.7, 30.4] as [number, number], headingDeg: 0 };
    const cam = chaseCameraPlacement(pose, {
      behindMeters: 10,
      lookAheadMeters: 14,
      altitudeMeters: 4,
      lookAtAltitudeMeters: 1,
    });
    expect(cam.position.lat).toBeLessThan(pose.lngLat[1]);
    expect(cam.lookAt.lat).toBeGreaterThan(pose.lngLat[1]);
    expect(cam.position.altitude).toBe(4);
    expect(cam.lookAt.altitude).toBe(1);
  });
});
