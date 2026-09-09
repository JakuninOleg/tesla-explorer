import { describe, expect, it } from "vitest";
import {
  buildLocalYoutubeSearchQuery,
  isYoutubeVideoId,
  resolveYoutubeVideoId,
} from "@/features/places/resolve-youtube";

describe("buildLocalYoutubeSearchQuery", () => {
  it("includes locality so generic names stay local and prefers Shorts", () => {
    const q = buildLocalYoutubeSearchQuery({
      placeName: "Asia Cafe",
      locality: "Austin Texas",
    });
    expect(q).toContain("Asia Cafe");
    expect(q).toContain("Austin Texas");
    expect(q.toLowerCase()).toContain("#shorts");
    expect(q).not.toMatch(/Ohio/i);
  });

  it("falls back to coarse coords when locality missing", () => {
    const q = buildLocalYoutubeSearchQuery({
      placeName: "Asia Cafe",
      lat: 30.402,
      lng: -97.726,
    });
    expect(q).toContain("30.40");
    expect(q).toContain("-97.73");
    expect(q).toContain("#shorts");
  });
});

describe("resolveYoutubeVideoId", () => {
  it("validates video id shape", () => {
    expect(isYoutubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isYoutubeVideoId("bad")).toBe(false);
  });

  it("passes location bias and short duration to YouTube Data API", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    let calls = 0;
    const fetchImpl: typeof fetch = async (input) => {
      calls += 1;
      const url = String(input);
      expect(url).toContain("googleapis.com/youtube/v3/search");
      expect(url).toContain("Asia");
      expect(url).toContain("location=");
      expect(url).toContain("30.4");
      expect(url).toContain("locationRadius=50km");
      expect(url).toContain("videoDuration=short");
      return new Response(
        JSON.stringify({
          items: [{ id: { videoId: "dQw4w9WgXcQ" } }],
        }),
        { status: 200 },
      );
    };
    const id = await resolveYoutubeVideoId(
      "Asia Cafe Austin Texas #shorts",
      {
        fetchImpl,
        lat: 30.4,
        lng: -97.7,
      },
    );
    expect(id).toBe("dQw4w9WgXcQ");
    expect(calls).toBe(1);
    delete process.env.YOUTUBE_API_KEY;
  });

  it("falls back to InnerTube JSON when Data API missing", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const fetchImpl: typeof fetch = async (input, init) => {
      expect(String(input)).toContain("youtubei/v1/search");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body)) as { query: string };
      expect(body.query).toContain("Austin");
      return new Response(
        JSON.stringify({
          contents: {
            twoColumnSearchResultsRenderer: {
              primaryContents: {
                sectionListRenderer: {
                  contents: [
                    {
                      itemSectionRenderer: {
                        contents: [
                          {
                            videoRenderer: { videoId: "AbCdEfGhIjK" },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        }),
        { status: 200 },
      );
    };
    const id = await resolveYoutubeVideoId("Asia Cafe Austin Texas #shorts", {
      fetchImpl,
    });
    expect(id).toBe("AbCdEfGhIjK");
  });

  it("prefers videoRenderer over stray videoId fields", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          prefetch: { videoId: "zzzzzzzzzzz" },
          contents: {
            itemSectionRenderer: {
              contents: [{ videoRenderer: { videoId: "primaryHit12" } }],
            },
          },
        }),
        { status: 200 },
      );
    const id = await resolveYoutubeVideoId("Lake park Austin", { fetchImpl });
    expect(id).toBe("primaryHit12");
  });
});
