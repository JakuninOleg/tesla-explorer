import { describe, expect, it } from "vitest";
import {
  createEvCarGroup,
  modelOrientationFromBearing,
} from "@/features/map/car-model-layer";

describe("ev car mesh", () => {
  it("builds a detailed three.js group (not a single box)", () => {
    const car = createEvCarGroup();
    expect(car.children.length).toBeGreaterThanOrEqual(12);
  });

  it("uses Z-up yaw only (rotateZ), no Rx tilt that flips the car", () => {
    const east = modelOrientationFromBearing(90);
    expect(east.rotateX).toBe(0);
    expect(east.rotateY).toBe(0);
    expect(east.rotateZ).toBeCloseTo(-Math.PI / 2, 6);
    expect(modelOrientationFromBearing(0).rotateZ).toBeCloseTo(0, 6);
  });
});
