/**
 * Resolve a place name to a YouTube video id for in-app embed.
 * Prefers YOUTUBE_API_KEY (Data API v3); falls back to YouTube InnerTube guest search.
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/;

export function isYoutubeVideoId(value: string): boolean {
  return VIDEO_ID_RE.test(value);
}

type DataApiSearch = {
  items?: Array<{ id?: { videoId?: string } }>;
};

export async function resolveYoutubeVideoId(
  query: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<string | null> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) {
    return null;
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("q", q);
    url.searchParams.set("key", apiKey);
    try {
      const res = await fetchImpl(url.toString());
      if (res.ok) {
        const body = (await res.json()) as DataApiSearch;
        const id = body.items?.[0]?.id?.videoId;
        if (id && isYoutubeVideoId(id)) {
          return id;
        }
      }
    } catch {
      // fall through to InnerTube
    }
  }

  return resolveViaInnerTube(q, fetchImpl);
}

function collectVideoIds(node: unknown, out: string[], depth = 0): void {
  if (out.length > 0 || depth > 16 || node == null) {
    return;
  }
  if (typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoIds(item, out, depth + 1);
      if (out.length > 0) {
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
    if (typeof id === "string" && isYoutubeVideoId(id)) {
      out.push(id);
      return;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "videoId") {
      continue;
    }
    collectVideoIds(value, out, depth + 1);
    if (out.length > 0) {
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
