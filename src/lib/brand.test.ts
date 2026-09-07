import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";

describe("brand", () => {
  it("exposes Tesla Explorer naming and mark path", () => {
    expect(brand.name).toBe("Tesla Explorer");
    expect(brand.markSrc).toBe("/brand/mark.png");
    expect(brand.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(brand.background).toBe("#050505");
  });

  it("keeps a short English tagline", () => {
    expect(brand.tagline.length).toBeGreaterThan(8);
    expect(brand.tagline).not.toMatch(/todo|lorem/i);
  });
});
