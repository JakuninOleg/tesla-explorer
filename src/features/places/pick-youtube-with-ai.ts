/**
 * Go-Ai picks ONE YouTube video id from a real candidate list.
 * Never invents ids — response must be in the provided set or null.
 */

import {
  goAiChatCompletions,
  readGoAiSafeError,
} from "@/features/ai/go-ai-client";
import type { GoAiChatCompletionResponse } from "@/features/ai/go-ai-types";
import {
  isYoutubeVideoId,
  type YoutubeCandidate,
  type YoutubePlaceKind,
} from "@/features/places/resolve-youtube";

export function buildYoutubePickSystemPrompt(): string {
  return [
    "You pick ONE YouTube video for a leisure stop on a Tesla Explorer route.",
    "You receive the place name, stop kind, locality, and a JSON list of real search hits (videoId + title).",
    "Choose the video that best shows THIS place as a visitor would experience it:",
    "food → restaurant/cafe food review or tasting at that venue;",
    "scenic/activity/viewpoint → walking tour, walkthrough, park stroll, playground — NOT scuba/diving/underwater near a dam,",
    "NOT funerals/death, NOT a different city with a similar name.",
    "Reply with JSON only: {\"videoId\":\"...\"} or {\"videoId\":null}.",
    "videoId MUST be copied exactly from the list — never invent an id.",
    "If none are clearly about this place, return null.",
  ].join(" ");
}

export function buildYoutubePickUserPrompt(options: {
  placeName: string;
  kind?: YoutubePlaceKind | null;
  locality?: string | null;
  candidates: YoutubeCandidate[];
}): string {
  const lines = [
    `Place: ${options.placeName}`,
    `Kind: ${options.kind ?? "other"}`,
    `Locality: ${options.locality?.trim() || "unknown"}`,
    "Candidates:",
    JSON.stringify(
      options.candidates.map((c) => ({
        videoId: c.videoId,
        title: c.title.slice(0, 120),
      })),
    ),
  ];
  return lines.join("\n");
}

/** Parse model JSON; only accept ids present in allowed set. */
export function parseYoutubePickResponse(
  content: string,
  allowedIds: Set<string>,
): string | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
      videoId?: unknown;
    };
    if (parsed.videoId == null || parsed.videoId === "") {
      return null;
    }
    if (typeof parsed.videoId !== "string") {
      return null;
    }
    const id = parsed.videoId.trim();
    if (!isYoutubeVideoId(id) || !allowedIds.has(id)) {
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

export async function pickYoutubeVideoIdWithAi(options: {
  placeName: string;
  kind?: YoutubePlaceKind | null;
  locality?: string | null;
  candidates: YoutubeCandidate[];
  signal?: AbortSignal;
}): Promise<string | null> {
  if (options.candidates.length === 0) {
    return null;
  }
  if (options.candidates.length === 1) {
    return options.candidates[0]!.videoId;
  }

  const allowedIds = new Set(options.candidates.map((c) => c.videoId));

  let response: Response;
  try {
    response = await goAiChatCompletions({
      body: {
        model: process.env.GO_AI_MODEL ?? "default",
        temperature: 0.1,
        messages: [
          { role: "system", content: buildYoutubePickSystemPrompt() },
          {
            role: "user",
            content: buildYoutubePickUserPrompt({
              placeName: options.placeName,
              kind: options.kind,
              locality: options.locality,
              candidates: options.candidates,
            }),
          },
        ],
      },
      signal: options.signal,
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    await readGoAiSafeError(response);
    return null;
  }

  try {
    const payload = (await response.json()) as GoAiChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      return null;
    }
    return parseYoutubePickResponse(content, allowedIds);
  } catch {
    return null;
  }
}
