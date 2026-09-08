import { describe, expect, it, vi } from "vitest";
import { suggestAddresses } from "@/features/geo/mapbox-suggest";

describe("mapbox suggest", () => {
  it("returns empty without token or short query", async () => {
    const prev = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    await expect(suggestAddresses("ta")).resolves.toEqual([]);
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = prev;
  });

  it("maps geocoding features when token is set", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";
    const fetchImpl = vi.fn(async () =>
      Response.json({
        features: [
          {
            id: "address.1",
            place_name: "100 Main St, Tampa, Florida",
            center: [-82.45, 27.95],
          },
        ],
      }),
    );

    const results = await suggestAddresses("100 Main", { fetchImpl });
    expect(results).toEqual([
      {
        id: "address.1",
        placeName: "100 Main St, Tampa, Florida",
        lat: 27.95,
        lng: -82.45,
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
