import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reverseGeocodeLocality } from "@/features/geo/mapbox-suggest";
import {
  buildLocalYoutubeSearchQuery,
  resolveYoutubeVideoId,
} from "@/features/places/resolve-youtube";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 20;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const rateByUser = new Map<string, { count: number; resetAt: number }>();
const cacheByQuery = new Map<
  string,
  { videoId: string | null; expiresAt: number }
>();

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
  if (lat != null && (lat < -90 || lat > 90)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (lng != null && (lng < -180 || lng > 180)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  let locality: string | null = null;
  if (lat != null && lng != null) {
    locality = await reverseGeocodeLocality(lat, lng);
  }

  const query = buildLocalYoutubeSearchQuery({
    placeName,
    locality,
    lat,
    lng,
  });

  const cacheKey = [
    query.toLowerCase(),
    lat?.toFixed(3) ?? "",
    lng?.toFixed(3) ?? "",
  ].join("|");
  const cached = cacheByQuery.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({
      videoId: cached.videoId,
      query,
      locality,
    });
  }

  const videoId = await resolveYoutubeVideoId(query, { lat, lng });
  cacheByQuery.set(cacheKey, {
    videoId: videoId ?? null,
    expiresAt: now + CACHE_TTL_MS,
  });
  return NextResponse.json({
    videoId: videoId ?? null,
    query,
    locality,
  });
}
