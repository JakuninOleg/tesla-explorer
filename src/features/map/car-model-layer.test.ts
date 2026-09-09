import { describe, expect, it } from "vitest";
import { createEvCarGroup } from "@/features/map/car-model-layer";

describe("ev car mesh", () => {
  it("builds a detailed three.js group (not a single box)", () => {
    const car = createEvCarGroup();
    expect(car.children.length).toBeGreaterThanOrEqual(14);
  });
});
