import type { ItineraryStop } from "@/features/routes/itinerary-schema";

export type PlaceContextLinks = {
  mapsUrl: string;
  youtubeUrl: string;
  query: string;
};

export function buildPlaceQuery(
  stop: Pick<ItineraryStop, "name" | "lat" | "lng">,
): string {
  if (typeof stop.lat === "number" && typeof stop.lng === "number") {
    return `${stop.name} ${stop.lat.toFixed(4)},${stop.lng.toFixed(4)}`;
  }
  return stop.name;
}

export function buildPlaceContextLinks(
  stop: Pick<ItineraryStop, "name" | "lat" | "lng">,
): PlaceContextLinks {
  const query = buildPlaceQuery(stop);
  const encoded = encodeURIComponent(query);

  const mapsUrl =
    typeof stop.lat === "number" && typeof stop.lng === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${stop.name} @${stop.lat},${stop.lng}`,
        )}`
      : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return {
    mapsUrl,
    youtubeUrl: `https://www.youtube.com/results?search_query=${encoded}+review`,
    query,
  };
}
