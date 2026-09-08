import { describe, expect, it } from "vitest";
import { buildPlaceContextLinks } from "@/features/places/place-links";

describe("place context links", () => {
  it("builds Maps and YouTube URLs for a stop with coordinates", () => {
    const links = buildPlaceContextLinks({
      name: "Pier overlook",
      lat: 27.95,
      lng: -82.45,
    });

    expect(links.mapsUrl).toContain("google.com/maps/search");
    expect(links.mapsUrl).toContain("Pier");
    expect(links.youtubeUrl).toContain("youtube.com/results");
    expect(links.youtubeUrl).toContain("review");
  });

  it("falls back to name-only search without coordinates", () => {
    const links = buildPlaceContextLinks({ name: "Local seafood" });
    expect(links.mapsUrl).toContain(encodeURIComponent("Local seafood"));
    expect(links.youtubeUrl).toContain(encodeURIComponent("Local seafood"));
  });
});
