import type { MappedStop } from "./route-geometry";

export type StartAnchor = "home" | "work";
export const DEFAULT_START_ANCHOR: StartAnchor = "home";

export function anchorStops(lat: number | null | undefined, lng: number | null | undefined, name: string): MappedStop[] {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
  return [{ name, lngLat: [lng, lat], listIndex: 0, role: "start", kind: "anchor" }];
}
