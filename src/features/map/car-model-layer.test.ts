import { describe, expect, it } from "vitest";
import { createEvCarGroup } from "@/features/map/car-model-layer";

describe("ev car mesh", () => {
  it("builds a three.js group with body parts", () => {
    const car = createEvCarGroup();
    expect(car.children.length).toBeGreaterThanOrEqual(5);
  });
});
