import { describe, expect, it } from "vitest";
import {
  createEvCarGroup,
  modelYawRadFromBearing,
} from "@/features/map/car-model-layer";

describe("ev car mesh", () => {
  it("builds a detailed three.js group (not a single box)", () => {
    const car = createEvCarGroup();
    expect(car.children.length).toBeGreaterThanOrEqual(14);
  });

  it("yaws so bearing 0 faces north (not sideways east)", () => {
    // At heading 0, offset -90° ⇒ −π/2 (nose north after Mapbox Rx).
    expect(modelYawRadFromBearing(0)).toBeCloseTo(-Math.PI / 2, 6);
    // Heading east (90°) ⇒ yaw −π (or π) after offset.
    expect(modelYawRadFromBearing(90)).toBeCloseTo(-Math.PI, 6);
  });
});
