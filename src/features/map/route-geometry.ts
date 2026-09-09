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

export type PoseAlongLine = {
  lngLat: LngLat;
  /** Degrees clockwise from north (Mapbox bearing). */
  headingDeg: number;
};

function bearingDegrees(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Offset a lng/lat by meters at a bearing (approx, fine for cinema follow). */
export function offsetLngLat(
  origin: LngLat,
  bearingDeg: number,
  meters: number,
): LngLat {
  const R = 6378137;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(origin[1]);
  const lng1 = toRad(origin[0]);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(meters / R) +
      Math.cos(lat1) * Math.sin(meters / R) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(meters / R) * Math.cos(lat1),
      Math.cos(meters / R) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [toDeg(lng2), toDeg(lat2)];
}

/** Sample pose (point + heading) along a LineString at progress 0..1. */
export function poseAlongLine(
  coordinates: LngLat[],
  progress: number,
): PoseAlongLine | null {
  if (coordinates.length === 0) {
    return null;
  }
  if (coordinates.length === 1) {
    return { lngLat: coordinates[0]!, headingDeg: 0 };
  }

  const clamped = Math.min(1, Math.max(0, progress));
  const segmentMiles: number[] = [];
  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const miles = haversineMiles(coordinates[i - 1]!, coordinates[i]!);
    segmentMiles.push(miles);
    total += miles;
  }

  if (total <= 0) {
    return {
      lngLat: coordinates[0]!,
      headingDeg: bearingDegrees(coordinates[0]!, coordinates[1]!),
    };
  }

  let remaining = total * clamped;
  for (let i = 0; i < segmentMiles.length; i += 1) {
    const seg = segmentMiles[i]!;
    const a = coordinates[i]!;
    const b = coordinates[i + 1]!;
    const headingDeg = bearingDegrees(a, b);
    if (remaining <= seg || i === segmentMiles.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, remaining / seg);
      return {
        lngLat: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        headingDeg,
      };
    }
    remaining -= seg;
  }

  const last = coordinates[coordinates.length - 1]!;
  const prev = coordinates[coordinates.length - 2]!;
  return { lngLat: last, headingDeg: bearingDegrees(prev, last) };
}

/** Sample a point along a LineString at progress 0..1. */
export function pointAlongLine(
  coordinates: LngLat[],
  progress: number,
): LngLat | null {
  return poseAlongLine(coordinates, progress)?.lngLat ?? null;
}

/** Camera target behind the car for 3rd-person cinema. */
export function cameraFollowTarget(
  pose: PoseAlongLine,
  behindMeters = 42,
): LngLat {
  const backBearing = (pose.headingDeg + 180) % 360;
  return offsetLngLat(pose.lngLat, backBearing, behindMeters);
}

/** Fraction 0..1 along the line closest to a target coordinate. */
export function progressNearCoordinate(
  coordinates: LngLat[],
  target: LngLat,
): number {
  if (coordinates.length === 0) {
    return 0;
  }
  if (coordinates.length === 1) {
    return 0;
  }

  let bestProgress = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  const samples = 48;
  for (let i = 0; i <= samples; i += 1) {
    const progress = i / samples;
    const point = pointAlongLine(coordinates, progress);
    if (!point) {
      continue;
    }
    const distance = haversineMiles(point, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = progress;
    }
  }
  return bestProgress;
}
