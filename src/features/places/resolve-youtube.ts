/**
 * Resolve a stop to a YouTube video that is ABOUT that place — not nearby
 * ambient clips (diver at a dam ≠ Mansfield Dam Park walk with kids).
 *
 * Strategy: quoted place-name queries → score titles that contain the place →
 * reject off-topic / death content. Prefer empty embed over a wrong clip.
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/;

export function isYoutubeVideoId(value: string): boolean {
  return VIDEO_ID_RE.test(value);
}

/** Only grammatical fluff — keep park/lake/dam as required place tokens. */
const QUERY_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "near",
  "at",
]);

const REJECT_GLOBAL_RE =
  /\b(funeral|funerals|burial|buried|cemetery|grave|graves|obituary|obituaries|memorial\s+service|died|death|mourning|cremation|cremated|wake\s+service|rip\b|rest\s+in\s+peace|погреб|похорон|отпеван|кладбищ|скончал|умерл)\b/i;

/** Nearby water sports ≠ walking a park / playground stop. */
const REJECT_LAND_VISIT_RE =
  /\b(scuba|scuba[\s-]?diving|diving|diver|divers|underwater|snorkeling|snorkel|freediving|wreck\s+dive|spearfishing)\b/i;

const PLACE_VISIT_BONUS_RE =
  /\b(review|reviews|food|restaurant|restaurants|cafe|café|dining|menu|taste|tasting|mukbang|eat|eats|tour|tours|visit|visited|walking|walkthrough|stroll|playground|family|kids|vlog|hike|trail)\b/i;

export type YoutubePlaceKind =
  | "scenic"
  | "food"
  | "charge"
  | "activity"
  | "viewpoint"
  | "other"
  | "anchor";

export function placeYoutubeIntentTerms(kind?: YoutubePlaceKind | null): string {
  switch (kind) {
    case "food":
      return "restaurant food review tasting";
    case "scenic":
    case "viewpoint":
      return "walking tour walkthrough stroll visit";
    case "activity":
      return "walking tour playground family visit";
    default:
      return "walking tour visit review";
  }
}

export function significantPlaceTokens(placeName: string): string[] {
  return placeName
    .toLowerCase()
    .split(/[^a-z0-9а-яё]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !QUERY_STOPWORDS.has(t));
}

/**
 * Ordered queries — exact place name first, then slightly looser.
 * Geo bias is applied via Data API location params, not as the relevance signal.
 */
export function buildPlaceYoutubeQueries(options: {
  placeName: string;
  locality?: string | null;
  lat?: number | null;
  lng?: number | null;
  kind?: YoutubePlaceKind | null;
}): string[] {
  const name = options.placeName.trim().slice(0, 80);
  if (name.length < 2) {
    return [];
  }
  const locality = options.locality?.trim().slice(0, 48) || null;
  const intent = placeYoutubeIntentTerms(options.kind);
  const quoted = `"${name}"`;
  const where =
    locality ??
    (typeof options.lat === "number" &&
    typeof options.lng === "number" &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng)
      ? `${options.lat.toFixed(2)},${options.lng.toFixed(2)}`
      : null);

  const raw: string[] = [];
  if (where) {
    raw.push(`${quoted} ${where} ${intent}`);
    raw.push(`${quoted} ${where} walkthrough`);
    raw.push(`${name} ${where} ${intent}`);
  } else {
    raw.push(`${quoted} ${intent}`);
    raw.push(`${quoted} walkthrough`);
    raw.push(`${name} ${intent}`);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of raw) {
    const clipped = q.replace(/\s+/g, " ").trim().slice(0, 120);
    const key = clipped.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clipped);
    }
  }
  return out;
}

/** @deprecated prefer buildPlaceYoutubeQueries — kept for call sites / tests */
export function buildLocalYoutubeSearchQuery(options: {
  placeName: string;
  locality?: string | null;
  lat?: number | null;
  lng?: number | null;
  kind?: YoutubePlaceKind | null;
}): string {
  return (
    buildPlaceYoutubeQueries(options)[0] ??
    `${options.placeName.trim()} ${placeYoutubeIntentTerms(options.kind)}`
  );
}

export type YoutubeCandidate = {
  videoId: string;
  title: string;
  description?: string;
};

export function isRejectedYoutubeTitle(
  title: string,
  kind?: YoutubePlaceKind | null,
): boolean {
  if (REJECT_GLOBAL_RE.test(title)) {
    return true;
  }
  if (
    kind === "scenic" ||
    kind === "viewpoint" ||
    kind === "activity" ||
    kind === "other" ||
    kind == null
  ) {
    if (REJECT_LAND_VISIT_RE.test(title)) {
      return true;
    }
  }
  return false;
}

/**
 * Score for in-app embed. Null = wrong place / off-topic — do not show.
 * Place identity must appear in the TITLE (description SEO spam is ignored).
 */
export function scoreYoutubeCandidate(
  candidate: YoutubeCandidate,
  placeName: string,
  kind?: YoutubePlaceKind | null,
): number | null {
  const title = candidate.title.trim();
  if (!title) {
    return null;
  }
  const titleLower = title.toLowerCase();
  const descLower = (candidate.description ?? "").toLowerCase();
  if (
    isRejectedYoutubeTitle(titleLower, kind) ||
    isRejectedYoutubeTitle(descLower, kind)
  ) {
    return null;
  }

  const normalizedPlace = placeName.toLowerCase().replace(/\s+/g, " ").trim();
  const tokens = significantPlaceTokens(placeName);
  const titleHasFullName =
    normalizedPlace.length >= 3 && titleLower.includes(normalizedPlace);

  if (tokens.length === 0) {
    return titleHasFullName ? 10 : null;
  }

  const titleMatched = tokens.filter((t) => titleLower.includes(t)).length;
  // Hard gate: every meaningful token of the place must be in the title,
  // or the full place name as a phrase. Description-only matches are rejected
  // (nearby dam dive can SEO-mention a park in the description).
  if (!titleHasFullName && titleMatched < tokens.length) {
    return null;
  }

  let score = titleHasFullName ? 25 : titleMatched * 6;
  if (PLACE_VISIT_BONUS_RE.test(titleLower)) {
    score += 4;
  }
  // Tiny hint from description only after title already qualified.
  if (tokens.every((t) => descLower.includes(t))) {
    score += 1;
  }
  return score;
}

export function pickBestYoutubeCandidate(
  candidates: YoutubeCandidate[],
  placeName: string,
  kind?: YoutubePlaceKind | null,
): string | null {
  let bestId: string | null = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    if (!isYoutubeVideoId(candidate.videoId)) {
      continue;
    }
    const score = scoreYoutubeCandidate(candidate, placeName, kind);
    if (score == null) {
      continue;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = candidate.videoId;
    }
  }
  return bestId;
}

type DataApiSearch = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; description?: string };
  }>;
};

export type ResolveYoutubeOptions = {
  fetchImpl?: typeof fetch;
  placeName?: string;
  kind?: YoutubePlaceKind | null;
  locality?: string | null;
  lat?: number | null;
  lng?: number | null;
  locationRadius?: string;
  preferShorts?: boolean;
  /** Extra search strings; default built from placeName + locality + kind. */
  queries?: string[];
  /** Ask Go-Ai to choose among eligible candidates (default true). */
  useAiPick?: boolean;
};

function candidatesFromDataApi(body: DataApiSearch): YoutubeCandidate[] {
  const out: YoutubeCandidate[] = [];
  for (const item of body.items ?? []) {
    const id = item.id?.videoId;
    if (!id || !isYoutubeVideoId(id)) {
      continue;
    }
    out.push({
      videoId: id,
      title: item.snippet?.title ?? "",
      description: item.snippet?.description ?? "",
    });
  }
  return out;
}

async function searchDataApiCandidates(
  apiKey: string,
  query: string,
  fetchImpl: typeof fetch,
  extras: Record<string, string>,
): Promise<YoutubeCandidate[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "15");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("order", "relevance");
  for (const [key, value] of Object.entries(extras)) {
    url.searchParams.set(key, value);
  }
  const res = await fetchImpl(url.toString());
  if (!res.ok) {
    return [];
  }
  const body = (await res.json()) as DataApiSearch;
  return candidatesFromDataApi(body);
}

function mergeCandidates(
  into: Map<string, YoutubeCandidate>,
  list: YoutubeCandidate[],
): void {
  for (const candidate of list) {
    if (!into.has(candidate.videoId)) {
      into.set(candidate.videoId, candidate);
    }
  }
}

/** Gather unique YouTube hits for a place (Data API + optional InnerTube). */
export async function collectYoutubePlaceCandidates(
  queryOrPlace: string,
  options?: ResolveYoutubeOptions,
): Promise<YoutubeCandidate[]> {
  const placeName = (options?.placeName ?? queryOrPlace).trim().slice(0, 80);
  if (placeName.length < 2) {
    return [];
  }

  const kind = options?.kind ?? null;
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

  const queries =
    options?.queries?.length && options.queries.length > 0
      ? [...options.queries]
      : buildPlaceYoutubeQueries({
          placeName,
          locality: options?.locality,
          lat,
          lng,
          kind,
        });

  if (
    (!options?.queries || options.queries.length === 0) &&
    queryOrPlace.trim() !== placeName &&
    queryOrPlace.trim().length >= 2
  ) {
    const legacy = queryOrPlace.trim().slice(0, 120);
    if (!queries.includes(legacy)) {
      queries.unshift(legacy);
    }
  }

  const locationExtras: Record<string, string> = hasLocation
    ? {
        location: `${lat},${lng}`,
        locationRadius: options?.locationRadius ?? "25km",
      }
    : {};

  const byId = new Map<string, YoutubeCandidate>();

  if (apiKey) {
    try {
      const attemptExtras: Record<string, string>[] = [];
      if (preferShorts && hasLocation) {
        attemptExtras.push({ ...locationExtras, videoDuration: "short" });
      }
      if (preferShorts) {
        attemptExtras.push({ videoDuration: "short" });
      }
      attemptExtras.push(
        hasLocation
          ? { ...locationExtras, videoDuration: "medium" }
          : { videoDuration: "medium" },
      );

      // Cap fan-out: first 2 queries × attempts, stop early when we have enough.
      for (const q of queries.slice(0, 2)) {
        for (const extras of attemptExtras) {
          const batch = await searchDataApiCandidates(
            apiKey,
            q,
            fetchImpl,
            extras,
          );
          mergeCandidates(byId, batch);
          if (byId.size >= 12) {
            break;
          }
        }
        if (byId.size >= 12) {
          break;
        }
      }
    } catch {
      // InnerTube below
    }
  }

  if (byId.size < 3) {
    for (const q of queries.slice(0, 2)) {
      const batch = await collectViaInnerTube(q, fetchImpl);
      mergeCandidates(byId, batch);
      if (byId.size >= 8) {
        break;
      }
    }
  }

  return [...byId.values()].slice(0, 15);
}

export function eligibleYoutubeCandidates(
  candidates: YoutubeCandidate[],
  placeName: string,
  kind?: YoutubePlaceKind | null,
): YoutubeCandidate[] {
  return candidates.filter(
    (c) => scoreYoutubeCandidate(c, placeName, kind) != null,
  );
}

export async function resolveYoutubeVideoId(
  queryOrPlace: string,
  options?: ResolveYoutubeOptions,
): Promise<string | null> {
  const placeName = (options?.placeName ?? queryOrPlace).trim().slice(0, 80);
  if (placeName.length < 2) {
    return null;
  }
  const kind = options?.kind ?? null;
  const useAiPick = options?.useAiPick !== false;

  const candidates = await collectYoutubePlaceCandidates(queryOrPlace, options);
  const eligible = eligibleYoutubeCandidates(candidates, placeName, kind);
  if (eligible.length === 0) {
    return null;
  }

  if (useAiPick && eligible.length > 1) {
    try {
      const { pickYoutubeVideoIdWithAi } = await import(
        "@/features/places/pick-youtube-with-ai"
      );
      const aiId = await pickYoutubeVideoIdWithAi({
        placeName,
        kind,
        locality: options?.locality,
        candidates: eligible,
      });
      if (aiId && eligible.some((c) => c.videoId === aiId)) {
        return aiId;
      }
    } catch {
      // fall through to heuristic
    }
  }

  return pickBestYoutubeCandidate(eligible, placeName, kind);
}

function titleFromRenderer(renderer: Record<string, unknown>): string {
  const title = renderer.title;
  if (!title || typeof title !== "object") {
    return "";
  }
  const record = title as {
    simpleText?: string;
    runs?: Array<{ text?: string }>;
  };
  if (typeof record.simpleText === "string") {
    return record.simpleText;
  }
  if (Array.isArray(record.runs)) {
    return record.runs.map((r) => r.text ?? "").join("");
  }
  return "";
}

function collectCandidates(
  node: unknown,
  out: YoutubeCandidate[],
  depth = 0,
): void {
  if (out.length >= 15 || depth > 16 || node == null) {
    return;
  }
  if (typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectCandidates(item, out, depth + 1);
      if (out.length >= 15) {
        return;
      }
    }
    return;
  }
  const record = node as Record<string, unknown>;

  const renderer = record.videoRenderer;
  if (renderer && typeof renderer === "object") {
    const video = renderer as { videoId?: unknown };
    const id = video.videoId;
    if (typeof id === "string" && isYoutubeVideoId(id)) {
      if (!out.some((c) => c.videoId === id)) {
        out.push({
          videoId: id,
          title: titleFromRenderer(renderer as Record<string, unknown>),
        });
      }
    }
  }

  const shorts = record.reelItemRenderer ?? record.shortsLockupViewModel;
  if (shorts && typeof shorts === "object") {
    collectCandidates(shorts, out, depth + 1);
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "videoId") {
      continue;
    }
    collectCandidates(value, out, depth + 1);
    if (out.length >= 15) {
      return;
    }
  }
}

async function collectViaInnerTube(
  query: string,
  fetchImpl: typeof fetch,
): Promise<YoutubeCandidate[]> {
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
      return [];
    }
    const body: unknown = await res.json();
    const candidates: YoutubeCandidate[] = [];
    collectCandidates(body, candidates);
    return candidates;
  } catch {
    return [];
  }
}

