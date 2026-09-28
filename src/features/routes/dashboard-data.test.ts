import { describe, expect, it } from "vitest";
import { filterDashboardRoutes, SCENARIOS, validPlannerDraft, validTripSettings } from "./dashboard-data";
import type { RouteListItem } from "./route-actions";
import ru from "../../../messages/ru.json";
import en from "../../../messages/en.json";

describe("dashboard planning", () => {
  it("matches the server prompt length constraint", () => {
    expect(validPlannerDraft(" dinner ")).toBe(false);
    expect(validPlannerDraft("Dinner and a walk")).toBe(true);
    expect(validPlannerDraft("a".repeat(4001))).toBe(false);
  });
  const routes: RouteListItem[] = (["proposed", "approved", "declined"] as const).map((status, index) => ({
    id: String(index), status, title: status, createdAt: new Date("2026-09-20"), availableHours: 3, rating: null,
  }));
  it("separates proposals from full route history without reordering", () => {
    expect(filterDashboardRoutes(routes, "all")).toEqual(routes);
    expect(filterDashboardRoutes(routes, "proposed").map((r) => r.status)).toEqual(["proposed"]);
    expect(filterDashboardRoutes(routes, "history").map((r) => r.status)).toEqual(["approved", "declined"]);
    expect(filterDashboardRoutes([], "all")).toEqual([]);
  });
  it("requires valid integer trip constraints before either composer sends", () => {
    expect(validTripSettings(3, 70)).toBe(true);
    for (const [hours, battery] of [[0, 70], [17, 70], [2.5, 70], [3, 0], [3, 101], [3, 70.5], [NaN, 70]]) {
      expect(validTripSettings(hours, battery)).toBe(false);
    }
  });
  it("has usable localized prompts and durations for every scenario", () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(4);
    for (const scenario of SCENARIOS) {
      expect(validTripSettings(scenario.hours, 70)).toBe(true);
      for (const messages of [ru, en]) {
        expect(messages.Dashboard.scenarios[scenario.id].prompt.length).toBeGreaterThan(20);
        expect(messages.Dashboard.scenarios[scenario.id].chip.length).toBeGreaterThan(0);
      }
    }
  });
});
