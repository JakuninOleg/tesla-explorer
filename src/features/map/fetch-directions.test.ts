import { describe, expect, it, vi } from "vitest";
import { fetchDrivingGeometry } from "@/features/map/fetch-directions";

describe("fetchDrivingGeometry", () => {
  it("falls back to straight line when directions fail", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    const line = await fetchDrivingGeometry(
      [
        {
          name: "A",
          kind: "anchor",
          role: "must",
          listIndex: 0,
          lngLat: [-82.5, 27.9],
        },
        {
          name: "B",
          kind: "food",
          role: "explore",
          listIndex: 1,
          lngLat: [-82.4, 28.0],
        },
      ],
      { fetchImpl, token: "test" },
    );

    expect(line?.coordinates).toEqual([
      [-82.5, 27.9],
      [-82.4, 28.0],
    ]);
  });
});
