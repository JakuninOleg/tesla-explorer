import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";
import { getWebManifest } from "@/lib/pwa-manifest";

describe("getWebManifest", () => {
  it("is installable: standalone display with required icon sizes", () => {
    const manifest = getWebManifest();

    expect(manifest.name).toBe(brand.name);
    expect(manifest.short_name).toBe(brand.shortName);
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.background_color).toBe(brand.background);
    expect(manifest.theme_color).toBe(brand.background);

    const sizes = (manifest.icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(manifest.icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  it("points icons at public /icons paths", () => {
    const manifest = getWebManifest();
    for (const icon of manifest.icons ?? []) {
      expect(icon.src.startsWith("/icons/")).toBe(true);
      expect(icon.type).toBe("image/png");
    }
  });
});
