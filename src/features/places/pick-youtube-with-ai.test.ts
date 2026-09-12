import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildYoutubePickSystemPrompt,
  parseYoutubePickResponse,
  pickYoutubeVideoIdWithAi,
} from "@/features/places/pick-youtube-with-ai";

describe("parseYoutubePickResponse", () => {
  const allowed = new Set(["goodPlace12", "otherPlace1"]);

  it("accepts a listed videoId", () => {
    expect(
      parseYoutubePickResponse('{"videoId":"goodPlace12"}', allowed),
    ).toBe("goodPlace12");
  });

  it("rejects invented or missing ids", () => {
    expect(parseYoutubePickResponse('{"videoId":"invented999"}', allowed)).toBeNull();
    expect(parseYoutubePickResponse('{"videoId":null}', allowed)).toBeNull();
    expect(parseYoutubePickResponse("not json", allowed)).toBeNull();
  });
});

describe("pickYoutubeVideoIdWithAi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns the only candidate without calling Go-Ai", async () => {
    const id = await pickYoutubeVideoIdWithAi({
      placeName: "Asia Cafe",
      kind: "food",
      candidates: [{ videoId: "onlyOneHit1", title: "Asia Cafe food" }],
    });
    expect(id).toBe("onlyOneHit1");
  });

  it("asks Go-Ai and accepts a listed pick", async () => {
    vi.stubEnv("GO_AI_BASE_URL", "https://go-ai.test");
    vi.stubEnv("GO_AI_SHARED_SECRET", "secret");
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '{"videoId":"bbbbbbbbbbb"}',
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const id = await pickYoutubeVideoIdWithAi({
      placeName: "Mansfield Dam Park",
      kind: "scenic",
      locality: "Austin Texas",
      candidates: [
        {
          videoId: "aaaaaaaaaaa",
          title: "Scuba diving Mansfield Dam",
        },
        {
          videoId: "bbbbbbbbbbb",
          title: "Mansfield Dam Park walking tour",
        },
      ],
    });
    expect(id).toBe("bbbbbbbbbbb");
    expect(fetchImpl).toHaveBeenCalled();
    expect(buildYoutubePickSystemPrompt()).toMatch(/never invent/i);
  });
});
