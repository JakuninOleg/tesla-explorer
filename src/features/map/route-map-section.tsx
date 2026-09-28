import { buildRouteStage } from "@/features/map/build-route-stage";
import { RouteCinema } from "@/features/map/route-cinema";
import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export async function RouteMapSection({ stops }: { stops: ItineraryStop[]; status?: "proposed" | "approved" | "declined" }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || null;
  const stage = await buildRouteStage(stops, { token: token ?? undefined });
  // A revised itinerary gets a fresh playback state, even after router.refresh().
  return <RouteCinema key={JSON.stringify(stops)} stops={stage.mapped} line={stage.line} token={token} itineraryStops={stops} />;
}
