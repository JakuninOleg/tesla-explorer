import type { LineString } from "geojson";
import { fetchDrivingGeometry } from "@/features/map/fetch-directions";
import {
  poseAlongLine,
  stopsWithCoordinates,
  type MappedStop,
  type PoseAlongLine,
} from "@/features/map/route-geometry";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export type RouteStage = {
  mapped: MappedStop[];
  line: LineString | null;
  startPose: PoseAlongLine | null;
  midPose: PoseAlongLine | null;
  /** Enough for cinema play + 3D car layer. */
  canCinema: boolean;
};

/** Same pipeline the route page uses before rendering RouteCinema. */
export async function buildRouteStage(
  stops: ItineraryStop[],
  options?: { token?: string; fetchImpl?: typeof fetch },
): Promise<RouteStage> {
  const mapped = stopsWithCoordinates(stops);
  const line =
    mapped.length >= 2
      ? await fetchDrivingGeometry(mapped, {
          token: options?.token,
          fetchImpl: options?.fetchImpl,
        })
      : null;
  const coords = (line?.coordinates ?? []) as MappedStop["lngLat"][];
  const startPose =
    coords.length >= 2 ? poseAlongLine(coords, 0) : null;
  const midPose =
    coords.length >= 2 ? poseAlongLine(coords, 0.5) : null;

  return {
    mapped,
    line,
    startPose,
    midPose,
    canCinema: Boolean(
      mapped.length >= 2 && line && line.coordinates.length >= 2 && startPose,
    ),
  };
}
