import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveYoutubeVideoId } from "@/features/places/resolve-youtube";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 20;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const rateByUser = new Map<string, { count: number; resetAt: number }>();
const cacheByQuery = new Map<string, { videoId: string | null; expiresAt: number }>();

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

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!allowRequest(session.user.id)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 160) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const cacheKey = q.toLowerCase();
  const cached = cacheByQuery.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return NextResponse.json({ videoId: cached.videoId });
  }

  const videoId = await resolveYoutubeVideoId(q);
  cacheByQuery.set(cacheKey, {
    videoId: videoId ?? null,
    expiresAt: now + CACHE_TTL_MS,
  });
  return NextResponse.json({ videoId: videoId ?? null });
}
