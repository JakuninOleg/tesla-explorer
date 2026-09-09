import type { LineString } from "geojson";
import type { LngLat, PoseAlongLine } from "@/features/map/route-geometry";
import { lineLengthMiles, offsetLngLat } from "@/features/map/route-geometry";

/** Base drive cinema length — ~2.5 minutes for a short hop. */
export const CINEMA_PLAYBACK_MIN_MS = 150_000;
export const CINEMA_PLAYBACK_MAX_MS = 280_000;

/** ~18s per road mile, clamped so play feels like a leisure drive, not a scrub. */
export function cinemaPlaybackDurationMs(line: LineString | null): number {
  if (!line || line.coordinates.length < 2) {
    return CINEMA_PLAYBACK_MIN_MS;
  }
  const miles = lineLengthMiles(line.coordinates as LngLat[]);
  const scaled = Math.round(miles * 18_000);
  return Math.min(
    CINEMA_PLAYBACK_MAX_MS,
    Math.max(CINEMA_PLAYBACK_MIN_MS, scaled),
  );
}

/** Fallback jumpTo params if FreeCamera unavailable. */
export const CINEMA_FOLLOW = {
  behindMeters: 9,
  zoom: 19.7,
  pitch: 72,
  idleZoom: 19.55,
} as const;

/** GTA-style chase — camera behind/above, look ahead of the car. */
export const CHASE_CAMERA = {
  behindMeters: 10,
  altitudeMeters: 3.8,
  lookAheadMeters: 14,
  lookAtAltitudeMeters: 1.1,
} as const;

export type ChaseCameraPlacement = {
  position: { lng: number; lat: number; altitude: number };
  lookAt: { lng: number; lat: number; altitude: number };
};

export function chaseCameraPlacement(
  pose: PoseAlongLine,
  options: {
    behindMeters?: number;
    altitudeMeters?: number;
    lookAheadMeters?: number;
    lookAtAltitudeMeters?: number;
  } = {},
): ChaseCameraPlacement {
  const behindMeters = options.behindMeters ?? CHASE_CAMERA.behindMeters;
  const altitudeMeters = options.altitudeMeters ?? CHASE_CAMERA.altitudeMeters;
  const lookAheadMeters =
    options.lookAheadMeters ?? CHASE_CAMERA.lookAheadMeters;
  const lookAtAltitudeMeters =
    options.lookAtAltitudeMeters ?? CHASE_CAMERA.lookAtAltitudeMeters;

  const camLngLat = offsetLngLat(
    pose.lngLat,
    (pose.headingDeg + 180) % 360,
    behindMeters,
  );
  const lookLngLat = offsetLngLat(
    pose.lngLat,
    pose.headingDeg,
    lookAheadMeters,
  );

  return {
    position: {
      lng: camLngLat[0],
      lat: camLngLat[1],
      altitude: altitudeMeters,
    },
    lookAt: {
      lng: lookLngLat[0],
      lat: lookLngLat[1],
      altitude: lookAtAltitudeMeters,
    },
  };
}
