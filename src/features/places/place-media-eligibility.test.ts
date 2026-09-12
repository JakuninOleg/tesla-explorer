import { describe, expect, it } from "vitest";
import { isAlongRoutePlaceStop } from "@/features/places/place-media-eligibility";

describe("isAlongRoutePlaceStop", () => {
  it("allows leisure stops along the route", () => {
    expect(
      isAlongRoutePlaceStop({
        name: "Asia Cafe",
        kind: "food",
        role: "explore",
      }),
    ).toBe(true);
    expect(
      isAlongRoutePlaceStop({
        name: "Mansfield Dam Park",
        kind: "scenic",
        role: "explore",
      }),
    ).toBe(true);
  });

  it("rejects home, work, charge, and anchor stops", () => {
    expect(
      isAlongRoutePlaceStop({
        name: "Home",
        kind: "anchor",
        role: "must",
      }),
    ).toBe(false);
    expect(
      isAlongRoutePlaceStop({
        name: "Work office",
        kind: "other",
        role: "must",
      }),
    ).toBe(false);
    expect(
      isAlongRoutePlaceStop({
        name: "Supercharger",
        kind: "charge",
        role: "charge",
      }),
    ).toBe(false);
    expect(
      isAlongRoutePlaceStop({
        name: "123 Speckled Trout Dr (home)",
        kind: "other",
        role: "must",
      }),
    ).toBe(false);
  });
});
