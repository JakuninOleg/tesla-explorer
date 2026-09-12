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
    youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `"${stop.name}" review visit`,
    )}`,
    query,
  };
}

/**
 * Cinema overlay media — embed Shorts/video by id.
 * Without an id, watchUrl is a locality + #shorts search (search embeds were removed by YouTube).
 */
export function buildYoutubeEmbedUrl(options: {
  videoId?: string | null;
  placeName: string;
  cityHint?: string;
}): { embedUrl: string | null; watchUrl: string } {
  const searchQuery = `"${options.placeName}"${
    options.cityHint ? ` ${options.cityHint}` : ""
  } walking tour visit review`;
  const watchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    searchQuery,
  )}`;
  const id = options.videoId?.trim();
  if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
    return {
      // Standard embed works for Shorts; mute=0 so the place reel can play with sound after user gesture.
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
      watchUrl: `https://www.youtube.com/shorts/${id}`,
    };
  }
  return { embedUrl: null, watchUrl };
}

/** @deprecated use buildYoutubeEmbedUrl — kept for older imports/tests rename */
export function buildYoutubeEmbedSearchUrl(placeName: string): string {
  return buildYoutubeEmbedUrl({ placeName }).watchUrl;
}
