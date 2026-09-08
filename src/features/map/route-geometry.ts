import type { LineString } from "geojson";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export type LngLat = [number, number];

export type MappedStop = {
  name: string;
  kind: string;
  role: string;
  lngLat: LngLat;
  listIndex: number;
};

export function stopsWithCoordinates(stops: ItineraryStop[]): MappedStop[] {
  return stops
    .map((stop, listIndex) => ({ stop, listIndex }))
    .filter(
      (
        entry,
      ): entry is {
        stop: ItineraryStop & { lat: number; lng: number };
        listIndex: number;
      } =>
        typeof entry.stop.lat === "number" &&
        typeof entry.stop.lng === "number" &&
        Number.isFinite(entry.stop.lat) &&
        Number.isFinite(entry.stop.lng),
    )
    .map(({ stop, listIndex }) => ({
      name: stop.name,
      kind: stop.kind,
      role: stop.role ?? "explore",
      lngLat: [stop.lng, stop.lat] as LngLat,
      listIndex,
    }));
}

/** Fallback geometry when Directions API is unavailable. */
export function buildStraightLineGeometry(
  mapped: MappedStop[],
): LineString | null {
  if (mapped.length < 2) {
    return null;
  }

  return {
    type: "LineString",
    coordinates: mapped.map((stop) => stop.lngLat),
  };
}

export function boundsFromCoordinates(
  coordinates: LngLat[],
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) {
    return null;
  }

  let minLng = coordinates[0]![0];
  let maxLng = coordinates[0]![0];
  let minLat = coordinates[0]![1];
  let maxLat = coordinates[0]![1];

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function lineLengthMiles(coordinates: LngLat[]): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    total += haversineMiles(coordinates[i - 1]!, coordinates[i]!);
  }
  return total;
}

function haversineMiles(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Sample a point along a LineString at progress 0..1. */
export function pointAlongLine(
  coordinates: LngLat[],
  progress: number,
): LngLat | null {
  if (coordinates.length === 0) {
    return null;
  }
  if (coordinates.length === 1 || progress <= 0) {
    return coordinates[0]!;
  }
  if (progress >= 1) {
    return coordinates[coordinates.length - 1]!;
  }

  const segmentMiles: number[] = [];
  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const miles = haversineMiles(coordinates[i - 1]!, coordinates[i]!);
    segmentMiles.push(miles);
    total += miles;
  }

  if (total <= 0) {
    return coordinates[0]!;
  }

  let remaining = total * progress;
  for (let i = 0; i < segmentMiles.length; i += 1) {
    const seg = segmentMiles[i]!;
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      const a = coordinates[i]!;
      const b = coordinates[i + 1]!;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    remaining -= seg;
  }

  return coordinates[coordinates.length - 1]!;
}
