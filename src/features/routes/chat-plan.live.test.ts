/**
 * Live Go-Ai smoke: single-shot plan prompt must parse for the Austin kids chat case.
 * Skips when GO_AI_* missing (CI).
 */
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseItineraryResponse } from "@/features/routes/itinerary-schema";
import {
  buildDriverContextBlock,
  buildPlanSystemPrompt,
} from "@/features/routes/plan-prompt";
import { estimateRangeMiles } from "@/features/routes/tesla-range";

function loadEnv(): Record<string, string> {
  if (!existsSync(".env.local")) {
    return {};
  }
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        let v = l.slice(i + 1);
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i), v];
      }),
  );
}

const env = loadEnv();
const hasGoAi = Boolean(env.GO_AI_BASE_URL && env.GO_AI_SHARED_SECRET);

describe("live Go-Ai chat → itinerary (smoke)", () => {
  it.skipIf(!hasGoAi)(
    "returns parseable stops JSON for the Chinese food + kids water request",
    async () => {
      const base = env.GO_AI_BASE_URL!.replace(/\/$/, "");
      const profile = {
        homeAddress: "12301 Speckled Trout Dr, Austin, TX 78750",
        homeLat: 30.435,
        homeLng: -97.794,
        workAddress: "11410 Century Oaks Terrace, Austin, TX 78758",
        workLat: 30.402,
        workLng: -97.726,
        household: "family" as const,
        kidsCount: 2,
        aboutMe: "Dad",
        interests: "food parks",
        teslaModel: "Model Y",
      };
      const range = estimateRangeMiles({
        model: "Model Y",
        batteryPercent: 70,
      });
      const context = buildDriverContextBlock({
        profile,
        range,
        pastRoutes: [],
        startAnchor: "home",
        batteryPercent: 70,
        availableHours: 3,
      });
      const request =
        "Хочу покушать китайской еды и прогуляться со своими детишками где-то возле воды";

      const res = await fetch(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GO_AI_SHARED_SECRET}`,
        },
        body: JSON.stringify({
          model: env.GO_AI_MODEL || "default",
          temperature: 0.3,
          messages: [
            { role: "system", content: buildPlanSystemPrompt() },
            {
              role: "user",
              content: `${context}\nRequest: ${request}`,
            },
          ],
        }),
      });

      expect(res.ok).toBe(true);
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      expect(content).toBeTruthy();
      const itinerary = parseItineraryResponse(content!);
      expect(itinerary.stops.length).toBeGreaterThanOrEqual(2);
      expect(itinerary.stops.some((s) => s.lat != null && s.lng != null)).toBe(
        true,
      );
    },
    60_000,
  );
});
