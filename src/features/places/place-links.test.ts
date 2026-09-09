import { describe, expect, it } from "vitest";
import {
  buildPlaceContextLinks,
  buildYoutubeEmbedUrl,
} from "@/features/places/place-links";

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

  it("embeds a concrete video id and null embed without id", () => {
    const withId = buildYoutubeEmbedUrl({
      placeName: "Pease Park",
      videoId: "dQw4w9WgXcQ",
    });
    expect(withId.embedUrl).toContain("/embed/dQw4w9WgXcQ");
    expect(withId.watchUrl).toContain("watch?v=dQw4w9WgXcQ");

    const noId = buildYoutubeEmbedUrl({ placeName: "Asia Cafe Austin" });
    expect(noId.embedUrl).toBeNull();
    expect(noId.watchUrl).toContain("youtube.com/results");
  });
});
