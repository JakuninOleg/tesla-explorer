import type { LineString } from "geojson";
import {
  buildStraightLineGeometry,
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
    return buildStraightLineGeometry(mapped);
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
    const response = await fetchImpl(url.toString());
    if (!response.ok) {
      return buildStraightLineGeometry(mapped);
    }
    const body = (await response.json()) as DirectionsResponse;
    const coordinates = body.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      return buildStraightLineGeometry(mapped);
    }
    return { type: "LineString", coordinates };
  } catch {
    return buildStraightLineGeometry(mapped);
  }
}
