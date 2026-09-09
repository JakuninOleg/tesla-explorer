/**
 * Resolve a place name to a YouTube Short id for in-app embed.
 * Prefers YOUTUBE_API_KEY (Data API v3) with location bias + short duration;
 * falls back to InnerTube guest search with a locality + #shorts query.
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/;

export function isYoutubeVideoId(value: string): boolean {
  return VIDEO_ID_RE.test(value);
}

/** Geo-qualified Shorts search — "Asia Cafe" alone must not resolve to another state. */
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
    parts.push(`${options.lat.toFixed(2)},${options.lng.toFixed(2)}`);
  }
  // Prefer vertical Shorts over long form travel vlogs.
  parts.push("#shorts");
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
  /** Prefer Shorts / sub-4-minute clips (default true). */
  preferShorts?: boolean;
};

function firstVideoId(body: DataApiSearch): string | null {
  for (const item of body.items ?? []) {
    const id = item.id?.videoId;
    if (id && isYoutubeVideoId(id)) {
      return id;
    }
  }
  return null;
}

async function searchDataApi(
  apiKey: string,
  query: string,
  fetchImpl: typeof fetch,
  extras: Record<string, string>,
): Promise<string | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("order", "relevance");
  for (const [key, value] of Object.entries(extras)) {
    url.searchParams.set(key, value);
  }
  const res = await fetchImpl(url.toString());
  if (!res.ok) {
    return null;
  }
  const body = (await res.json()) as DataApiSearch;
  return firstVideoId(body);
}

export async function resolveYoutubeVideoId(
  query: string,
  options?: ResolveYoutubeOptions,
): Promise<string | null> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) {
    return null;
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const preferShorts = options?.preferShorts !== false;
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const lat = options?.lat;
  const lng = options?.lng;
  const hasLocation =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const locationExtras: Record<string, string> = hasLocation
    ? {
        location: `${lat},${lng}`,
        locationRadius: options?.locationRadius ?? "50km",
      }
    : {};

  if (apiKey) {
    try {
      // 1) Local Shorts / short clips
      if (preferShorts) {
        const shortLocal = await searchDataApi(apiKey, q, fetchImpl, {
          ...locationExtras,
          videoDuration: "short",
        });
        if (shortLocal) {
          return shortLocal;
        }
        // 2) Shorts without geo (still #shorts in query)
        const shortAny = await searchDataApi(apiKey, q, fetchImpl, {
          videoDuration: "short",
        });
        if (shortAny) {
          return shortAny;
        }
      }
      // 3) Any local video
      const local = await searchDataApi(apiKey, q, fetchImpl, locationExtras);
      if (local) {
        return local;
      }
      // 4) Any video for the query
      const any = await searchDataApi(apiKey, q, fetchImpl, {});
      if (any) {
        return any;
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

  const renderer = record.videoRenderer;
  if (renderer && typeof renderer === "object") {
    const id = (renderer as { videoId?: unknown }).videoId;
    if (typeof id === "string" && isYoutubeVideoId(id) && !out.includes(id)) {
      out.push(id);
    }
  }

  // Shorts shelf / reel renderers
  const shorts = record.reelItemRenderer ?? record.shortsLockupViewModel;
  if (shorts && typeof shorts === "object") {
    const nested: string[] = [];
    collectVideoIds(shorts, nested, depth + 1);
    for (const id of nested) {
      if (!out.includes(id)) {
        out.push(id);
      }
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
