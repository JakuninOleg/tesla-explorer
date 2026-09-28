import type { RouteListItem } from "./route-actions";

export const SCENARIOS = [
  { id: "dinner", image: "route-dinner.jpg", hours: 3 },
  { id: "nature", image: "route-bonnell.jpg", hours: 4 },
  { id: "family", image: "route-zilker.jpg", hours: 3 },
  { id: "quiet", image: "route-austin.jpg", hours: 2 },
] as const;
export type RouteFilter = "all" | "proposed" | "history";
export function filterDashboardRoutes(routes: RouteListItem[], filter: RouteFilter) {
  return routes.filter((route) => filter === "all" || (filter === "history" ? route.status !== "proposed" : route.status === "proposed"));
}
export function validTripSettings(hours: number, battery: number) {
  return Number.isInteger(hours) && hours >= 1 && hours <= 16 && Number.isInteger(battery) && battery >= 1 && battery <= 100;
}
export function validPlannerDraft(draft: string) {
  const length = draft.trim().length;
  return length >= 8 && length <= 4000;
}
