import type { LineString } from "geojson";
import { lineLengthMiles, type LngLat } from "@/features/map/route-geometry";

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

/**
 * Chase cam via jumpTo (reliable with Three custom layers).
 * FreeCamera was dropped — it made the WebGL car disappear in prod.
 */
export const CINEMA_FOLLOW = {
  behindMeters: 12,
  zoom: 18.9,
  pitch: 62,
  idleZoom: 18.75,
} as const;
