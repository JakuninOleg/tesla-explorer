import type { LineString } from "geojson";
import { lineLengthMiles, progressNearCoordinate, type LngLat, type MappedStop } from "@/features/map/route-geometry";

export function orderedStopProgress(coordinates: LngLat[], stops: MappedStop[]) {
  let previous = 0;
  return stops.map((stop, index) => {
    const at = index === 0 ? 0 : index === stops.length - 1 ? 1 : progressNearCoordinate(coordinates, stop.lngLat, previous);
    previous = at;
    return { index: stop.listIndex, at };
  });
}

export function playbackProgress(from: number, elapsedMs: number, durationMs: number, speed: number): number {
  return Math.min(1, Math.max(0, from + Math.max(0, elapsedMs) * speed / Math.max(1, durationMs)));
}

export function playbackTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

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
 * Free look = Mapbox pan/zoom enabled while chase is optional (followCamera).
 */
export const CINEMA_FOLLOW = {
  behindMeters: 12,
  zoom: 18.9,
  pitch: 62,
  idleZoom: 18.75,
} as const;

/** Effective cinema duration after a playback rate multiplier (0.5× … 4×). */
export function cinemaPlaybackMsAtRate(
  line: LineString | null,
  rate: number,
): number {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
  return Math.max(1_000, Math.round(cinemaPlaybackDurationMs(line) / safeRate));
}
