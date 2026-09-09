/**
 * Resolve a place name to a YouTube video id for in-app embed.
 * Prefers YOUTUBE_API_KEY (Data API v3) with optional lat/lng location bias;
 * falls back to YouTube InnerTube guest search with a locality-qualified query.
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/;

export function isYoutubeVideoId(value: string): boolean {
  return VIDEO_ID_RE.test(value);
}

/** Build a geo-qualified search string so "Asia Cafe" ≠ Ohio when the stop is in Austin. */
export function buildLocalYoutubeSearchQuery(options: {
  placeName: string;
  locality?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string {
  const name = options.placeName.trim().slice(0, 80);
  const locality = options.locality?.trim().slice(0, 60);
  const parts = [name];
  if (locality) {
    parts.push(locality);
  } else if (
    typeof options.lat === "number" &&
    typeof options.lng === "number" &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)
  ) {
    // Coarse pin when reverse-geocode is unavailable
    parts.push(`${options.lat.toFixed(2)},${options.lng.toFixed(2)}`);
  }
  parts.push("food review");
  return parts.join(" ").slice(0, 120);
}

type DataApiSearch = {
  items?: Array<{ id?: { videoId?: string } }>;
};

export type ResolveYoutubeOptions = {
  fetchImpl?: typeof fetch;
  /** WGS84 — biases Data API results to nearby videos. */
  lat?: number | null;
  lng?: number | null;
  /** Radius for Data API location filter, e.g. "40km". */
  locationRadius?: string;
};

export async function resolveYoutubeVideoId(
  query: string,
  options?: ResolveYoutubeOptions,
): Promise<string | null> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) {
    return null;
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const lat = options?.lat;
  const lng = options?.lng;
  const hasLocation =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  if (apiKey) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "5");
    url.searchParams.set("q", q);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("safeSearch", "moderate");
    if (hasLocation) {
      url.searchParams.set("location", `${lat},${lng}`);
      url.searchParams.set(
        "locationRadius",
        options?.locationRadius ?? "50km",
      );
      url.searchParams.set("order", "relevance");
    }
    try {
      const res = await fetchImpl(url.toString());
      if (res.ok) {
        const body = (await res.json()) as DataApiSearch;
        for (const item of body.items ?? []) {
          const id = item.id?.videoId;
          if (id && isYoutubeVideoId(id)) {
            return id;
          }
        }
      }
    } catch {
      // fall through to InnerTube
    }
  }

  return resolveViaInnerTube(q, fetchImpl);
}

function collectVideoIds(node: unknown, out: string[], depth = 0): void {
  if (out.length >= 5 || depth > 16 || node == null) {
    return;
  }
  if (typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoIds(item, out, depth + 1);
      if (out.length >= 5) {
        return;
      }
    }
    return;
  }
  const record = node as Record<string, unknown>;

  // Prefer ranked search hits (videoRenderer), not sidebar/prefetch ids.
  const renderer = record.videoRenderer;
  if (renderer && typeof renderer === "object") {
    const id = (renderer as { videoId?: unknown }).videoId;
    if (typeof id === "string" && isYoutubeVideoId(id) && !out.includes(id)) {
      out.push(id);
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "videoId") {
      continue;
    }
    collectVideoIds(value, out, depth + 1);
    if (out.length >= 5) {
      return;
    }
  }
}

async function resolveViaInnerTube(
  query: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  try {
    const res = await fetchImpl(
      "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; TeslaExplorer/1.0; +https://tesla-explorer.vercel.app)",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20260101.00.00",
              hl: "en",
              gl: "US",
            },
          },
          query,
        }),
      },
    );
    if (!res.ok) {
      return null;
    }
    const body: unknown = await res.json();
    const ids: string[] = [];
    collectVideoIds(body, ids);
    return ids[0] ?? null;
  } catch {
    return null;
  }
}
