import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reverseGeocodeLocality } from "@/features/geo/mapbox-suggest";
import {
  buildPlaceYoutubeQueries,
  resolveYoutubeVideoId,
  type YoutubePlaceKind,
} from "@/features/places/resolve-youtube";
import { isAlongRoutePlaceStop } from "@/features/places/place-media-eligibility";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 30;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** Bump when scoring / query shape changes so bad embeds are not sticky. */
const CACHE_VERSION = "v4-ai-pick";

const rateByUser = new Map<string, { count: number; resetAt: number }>();
const cacheByQuery = new Map<
  string,
  { videoId: string | null; expiresAt: number }
>();

const PLACE_KINDS = new Set<YoutubePlaceKind>([
  "scenic",
  "food",
  "charge",
  "activity",
  "viewpoint",
  "other",
  "anchor",
]);

function allowRequest(userId: string): boolean {
  const now = Date.now();
  const current = rateByUser.get(userId);
  if (!current || now >= current.resetAt) {
    rateByUser.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_MAX) {
    return false;
  }
  current.count += 1;
  return true;
}

function parseCoord(raw: string | null): number | null {
  if (raw == null || raw === "") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseKind(raw: string | null): YoutubePlaceKind | null {
  if (!raw) {
    return null;
  }
  return PLACE_KINDS.has(raw as YoutubePlaceKind)
    ? (raw as YoutubePlaceKind)
    : null;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!allowRequest(session.user.id)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const placeName = searchParams.get("q")?.trim() ?? "";
  if (placeName.length < 2 || placeName.length > 120) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const lat = parseCoord(searchParams.get("lat"));
  const lng = parseCoord(searchParams.get("lng"));
  const kind = parseKind(searchParams.get("kind"));
  if (lat != null && (lat < -90 || lat > 90)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (lng != null && (lng < -180 || lng > 180)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Home / work / charge — never resolve YouTube.
  if (
    !isAlongRoutePlaceStop({
      name: placeName,
      kind: kind ?? "other",
      role: kind === "charge" ? "charge" : "explore",
    })
  ) {
    return NextResponse.json({
      videoId: null,
      query: placeName,
      locality: null,
      skipped: "not_along_route_place",
    });
  }

  let locality: string | null = null;
  if (lat != null && lng != null) {
    locality = await reverseGeocodeLocality(lat, lng);
  }

  const queries = buildPlaceYoutubeQueries({
    placeName,
    locality,
    lat,
    lng,
    kind,
  });
  const primaryQuery = queries[0] ?? placeName;

  const cacheKey = [
    CACHE_VERSION,
    placeName.toLowerCase(),
    kind ?? "",
    locality?.toLowerCase() ?? "",
    lat?.toFixed(3) ?? "",
    lng?.toFixed(3) ?? "",
  ].join("|");
  const cached = cacheByQuery.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({
      videoId: cached.videoId,
      query: primaryQuery,
      locality,
    });
  }

  const videoId = await resolveYoutubeVideoId(placeName, {
    placeName,
    kind,
    locality,
    lat,
    lng,
    queries,
  });
  cacheByQuery.set(cacheKey, {
    videoId: videoId ?? null,
    expiresAt: now + CACHE_TTL_MS,
  });
  return NextResponse.json({
    videoId: videoId ?? null,
    query: primaryQuery,
    locality,
  });
}
