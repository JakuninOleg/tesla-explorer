/**
 * Human journey smoke (live APIs):
 * chat request → Go-Ai itinerary → Mapbox Directions → cinema poses → 3D EV mesh.
 * Skips when GO_AI_* or Mapbox token missing (CI without secrets).
 */
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEvCarGroup, CAR_MODEL_LAYER_ID } from "@/features/map/car-model-layer";
import { buildRouteStage } from "@/features/map/build-route-stage";
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
const mapboxToken = env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
const hasMapbox = mapboxToken.length > 10;
const canRun = hasGoAi && hasMapbox;

describe("human journey: chat → map stage → 3D car", () => {
  it.skipIf(!canRun)(
    "plans a real Austin kids trip and builds a cinema-ready 3D stage",
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
        aboutMe: "Dad who likes short weekend drives",
        interests: "food parks water",
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
      expect(content?.trim().length).toBeGreaterThan(20);

      const itinerary = parseItineraryResponse(content!);
      expect(itinerary.title.trim().length).toBeGreaterThan(2);
      expect(itinerary.summary.trim().length).toBeGreaterThan(8);
      expect(itinerary.stops.length).toBeGreaterThanOrEqual(2);

      const withCoords = itinerary.stops.filter(
        (s) => typeof s.lat === "number" && typeof s.lng === "number",
      );
      expect(withCoords.length).toBeGreaterThanOrEqual(2);

      const stage = await buildRouteStage(itinerary.stops, {
        token: mapboxToken,
      });

      expect(stage.mapped.length).toBeGreaterThanOrEqual(2);
      expect(stage.canCinema).toBe(true);
      expect(stage.line?.coordinates.length).toBeGreaterThan(2);
      expect(stage.startPose).not.toBeNull();
      expect(stage.midPose).not.toBeNull();
      expect(Number.isFinite(stage.startPose!.headingDeg)).toBe(true);

      const car = createEvCarGroup();
      expect(car.children.length).toBeGreaterThanOrEqual(5);
      expect(CAR_MODEL_LAYER_ID).toBe("tesla-explorer-ev-car");
    },
    90_000,
  );
});
