import { describe, expect, it } from "vitest";
import {
  buildLocalYoutubeSearchQuery,
  buildPlaceYoutubeQueries,
  isRejectedYoutubeTitle,
  isYoutubeVideoId,
  pickBestYoutubeCandidate,
  resolveYoutubeVideoId,
  scoreYoutubeCandidate,
  significantPlaceTokens,
} from "@/features/places/resolve-youtube";

describe("buildPlaceYoutubeQueries", () => {
  it("leads with a quoted place name + walk intent for parks", () => {
    const queries = buildPlaceYoutubeQueries({
      placeName: "Mansfield Dam Park",
      locality: "Austin Texas",
      kind: "scenic",
    });
    expect(queries[0]).toContain('"Mansfield Dam Park"');
    expect(queries[0]).toContain("Austin Texas");
    expect(queries[0].toLowerCase()).toMatch(/walk/);
    expect(queries.join(" ")).not.toMatch(/Ohio/i);
  });

  it("keeps park/lake/dam as required tokens", () => {
    expect(significantPlaceTokens("Mansfield Dam Park")).toEqual([
      "mansfield",
      "dam",
      "park",
    ]);
  });

  it("buildLocalYoutubeSearchQuery returns the primary query", () => {
    const q = buildLocalYoutubeSearchQuery({
      placeName: "Asia Cafe",
      locality: "Austin Texas",
      kind: "food",
    });
    expect(q).toContain('"Asia Cafe"');
    expect(q.toLowerCase()).toContain("food");
  });
});

describe("youtube place-title gate", () => {
  it("rejects funeral titles", () => {
    expect(isRejectedYoutubeTitle("Asian woman funeral service")).toBe(true);
  });

  it("rejects scuba/diving for park visits", () => {
    expect(
      isRejectedYoutubeTitle("Scuba diving at Mansfield Dam", "scenic"),
    ).toBe(true);
    expect(
      scoreYoutubeCandidate(
        {
          videoId: "dQw4w9WgXcQ",
          title: "Scuba diving Mansfield Dam Texas underwater",
        },
        "Mansfield Dam Park",
        "scenic",
      ),
    ).toBeNull();
  });

  it("requires every place token in the TITLE — not description SEO", () => {
    expect(
      scoreYoutubeCandidate(
        {
          videoId: "dQw4w9WgXcQ",
          title: "Cool dive near the dam",
          description: "Filmed by Mansfield Dam Park Austin",
        },
        "Mansfield Dam Park",
        "scenic",
      ),
    ).toBeNull();

    expect(
      scoreYoutubeCandidate(
        {
          videoId: "dQw4w9WgXcQ",
          title: "Mansfield Dam Park walking tour with kids",
        },
        "Mansfield Dam Park",
        "scenic",
      ),
    ).toBeGreaterThan(0);
  });

  it("rejects Asia-only hits for Asia Cafe", () => {
    expect(
      scoreYoutubeCandidate(
        {
          videoId: "dQw4w9WgXcQ",
          title: "Funeral of an Asian woman in Texas",
        },
        "Asia Cafe",
        "food",
      ),
    ).toBeNull();
    expect(
      scoreYoutubeCandidate(
        {
          videoId: "dQw4w9WgXcQ",
          title: "Asia Cafe Austin — food review",
        },
        "Asia Cafe",
        "food",
      ),
    ).toBeGreaterThan(0);
  });

  it("picks the park walk over a dam dive", () => {
    const id = pickBestYoutubeCandidate(
      [
        {
          videoId: "aaaaaaaaaaa",
          title: "Diving Mansfield Dam Texas scuba",
        },
        {
          videoId: "bbbbbbbbbbb",
          title: "Mansfield Dam Park family walking tour",
        },
      ],
      "Mansfield Dam Park",
      "scenic",
    );
    expect(id).toBe("bbbbbbbbbbb");
  });
});

describe("resolveYoutubeVideoId", () => {
  it("validates video id shape", () => {
    expect(isYoutubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isYoutubeVideoId("bad")).toBe(false);
  });

  it("searches with place-name scoring and skips funeral hits", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    let calls = 0;
    const fetchImpl: typeof fetch = async (input) => {
      calls += 1;
      const url = String(input);
      expect(url).toContain("googleapis.com/youtube/v3/search");
      expect(url).toContain("safeSearch=strict");
      return new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: "badFuneral01" },
              snippet: { title: "Asian woman funeral Texas" },
            },
            {
              id: { videoId: "dQw4w9WgXcQ" },
              snippet: {
                title: "Asia Cafe Austin food review",
                description: "Chinese restaurant",
              },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const id = await resolveYoutubeVideoId("Asia Cafe", {
      fetchImpl,
      placeName: "Asia Cafe",
      kind: "food",
      locality: "Austin Texas",
      lat: 30.4,
      lng: -97.7,
      useAiPick: false,
    });
    expect(id).toBe("dQw4w9WgXcQ");
    expect(calls).toBeGreaterThanOrEqual(1);
    delete process.env.YOUTUBE_API_KEY;
  });

  it("returns null when only off-topic titles match", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: "diveDiveDive" },
              snippet: { title: "Scuba diving Mansfield Dam Texas" },
            },
          ],
        }),
        { status: 200 },
      );
    const id = await resolveYoutubeVideoId("Mansfield Dam Park", {
      fetchImpl,
      placeName: "Mansfield Dam Park",
      kind: "scenic",
      locality: "Austin Texas",
      lat: 30.4,
      lng: -97.9,
      queries: ['"Mansfield Dam Park" Austin Texas walking tour'],
      preferShorts: false,
      useAiPick: false,
    });
    expect(id).toBeNull();
    delete process.env.YOUTUBE_API_KEY;
  });

  it("falls back to InnerTube with title gate", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const fetchImpl: typeof fetch = async (input, init) => {
      expect(String(input)).toContain("youtubei/v1/search");
      expect(init?.method).toBe("POST");
      return new Response(
        JSON.stringify({
          contents: {
            itemSectionRenderer: {
              contents: [
                {
                  videoRenderer: {
                    videoId: "AbCdEfGhIjK",
                    title: {
                      simpleText: "Asia Cafe Austin food tour",
                    },
                  },
                },
              ],
            },
          },
        }),
        { status: 200 },
      );
    };
    const id = await resolveYoutubeVideoId("Asia Cafe", {
      fetchImpl,
      placeName: "Asia Cafe",
      kind: "food",
      locality: "Austin Texas",
      queries: ['"Asia Cafe" Austin Texas restaurant food review'],
      useAiPick: false,
    });
    expect(id).toBe("AbCdEfGhIjK");
  });
});
