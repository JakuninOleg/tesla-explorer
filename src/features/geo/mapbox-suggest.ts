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

type MapboxContext = { id?: string; text?: string; short_code?: string };

type MapboxReverseFeature = MapboxFeature & {
  text?: string;
  context?: MapboxContext[];
  place_type?: string[];
};

type MapboxReverseResponse = {
  features?: MapboxReverseFeature[];
};

/**
 * City + region for YouTube search bias, e.g. "Austin Texas".
 * Uses Mapbox reverse geocode (place / locality + region).
 */
export async function reverseGeocodeLocality(
  lat: number,
  lng: number,
  options?: { fetchImpl?: typeof fetch },
): Promise<string | null> {
  const token = getMapboxToken();
  if (!token || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("types", "place,locality,neighborhood");
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "en");

  try {
    const response = await fetchImpl(url.toString());
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as MapboxReverseResponse;
    const feature = body.features?.[0];
    if (!feature) {
      return null;
    }

    const place =
      feature.text?.trim() ||
      feature.place_name?.split(",")[0]?.trim() ||
      null;
    const region = feature.context?.find((c) =>
      (c.id ?? "").startsWith("region"),
    );
    const regionName =
      region?.text?.trim() ||
      region?.short_code?.replace(/^US-/, "").trim() ||
      null;

    if (place && regionName) {
      return `${place} ${regionName}`;
    }
    return place;
  } catch {
    return null;
  }
}
