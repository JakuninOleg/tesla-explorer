import type { LineString } from "geojson";
import {
  type LngLat,
  type MappedStop,
} from "@/features/map/route-geometry";

type DirectionsResponse = {
  routes?: Array<{
    geometry?: { type: string; coordinates?: LngLat[] };
  }>;
};

export async function fetchDrivingGeometry(
  mapped: MappedStop[],
  options?: { fetchImpl?: typeof fetch; token?: string },
): Promise<LineString | null> {
  if (mapped.length < 2) {
    return null;
  }

  const token =
    options?.token ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
  if (!token) {
    return null;
  }

  // Mapbox Directions accepts up to 25 coordinates.
  const points = mapped.slice(0, 25).map((stop) => stop.lngLat);
  const path = points.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}`,
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);

  const fetchImpl = options?.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as DirectionsResponse;
    const coordinates = body.routes?.[0]?.geometry?.coordinates;
    if (body.routes?.[0]?.geometry?.type !== "LineString" || !coordinates || coordinates.length < 2 || !coordinates.every((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90)) {
      return null;
    }
    return { type: "LineString", coordinates };
  } catch {
    return null;
  }
}
