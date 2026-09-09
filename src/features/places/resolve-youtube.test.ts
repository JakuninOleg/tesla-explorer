import { describe, expect, it } from "vitest";
import {
  isYoutubeVideoId,
  resolveYoutubeVideoId,
} from "@/features/places/resolve-youtube";

describe("resolveYoutubeVideoId", () => {
  it("validates video id shape", () => {
    expect(isYoutubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isYoutubeVideoId("bad")).toBe(false);
  });

  it("uses YouTube Data API when key + fetch provided", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      expect(url).toContain("googleapis.com/youtube/v3/search");
      expect(url).toContain("Asia");
      return new Response(
        JSON.stringify({
          items: [{ id: { videoId: "dQw4w9WgXcQ" } }],
        }),
        { status: 200 },
      );
    };
    const id = await resolveYoutubeVideoId("Asia Cafe Austin", { fetchImpl });
    expect(id).toBe("dQw4w9WgXcQ");
    delete process.env.YOUTUBE_API_KEY;
  });

  it("falls back to InnerTube JSON when Data API missing", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const fetchImpl: typeof fetch = async (input, init) => {
      expect(String(input)).toContain("youtubei/v1/search");
      expect(init?.method).toBe("POST");
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
    const id = await resolveYoutubeVideoId("Pease Park", { fetchImpl });
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
    const id = await resolveYoutubeVideoId("Lake park", { fetchImpl });
    expect(id).toBe("primaryHit12");
  });
});
