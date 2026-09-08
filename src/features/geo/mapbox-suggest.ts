export type MapboxSuggestResult = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
};

type MapboxFeature = {
  id?: string;
  place_name?: string;
  center?: [number, number];
};

type MapboxGeocodeResponse = {
  features?: MapboxFeature[];
};

export function getMapboxToken(): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  return token || null;
}

export async function suggestAddresses(
  query: string,
  options?: { signal?: AbortSignal; fetchImpl?: typeof fetch },
): Promise<MapboxSuggestResult[]> {
  const token = getMapboxToken();
  const trimmed = query.trim();
  if (!token || trimmed.length < 3) {
    return [];
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "us");
  url.searchParams.set("types", "address,place,locality,neighborhood,poi");
  url.searchParams.set("limit", "5");
  url.searchParams.set("language", "en");

  const response = await fetchImpl(url.toString(), { signal: options?.signal });
  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as MapboxGeocodeResponse;
  const features = body.features ?? [];

  return features
    .map((feature) => {
      const lng = feature.center?.[0];
      const lat = feature.center?.[1];
      const placeName = feature.place_name?.trim();
      if (lng == null || lat == null || !placeName || !feature.id) {
        return null;
      }
      return {
        id: feature.id,
        placeName,
        lat,
        lng,
      } satisfies MapboxSuggestResult;
    })
    .filter((item): item is MapboxSuggestResult => item != null);
}
