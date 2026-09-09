import { describe, expect, it } from "vitest";
import {
  createEvCarGroup,
  modelOrientationFromBearing,
  modelYawRadFromBearing,
} from "@/features/map/car-model-layer";

describe("ev car mesh", () => {
  it("builds a detailed three.js group (not a single box)", () => {
    const car = createEvCarGroup();
    expect(car.children.length).toBeGreaterThanOrEqual(14);
  });

  it("puts bearing on rotateY (yaw), not rotateZ (roll/roof)", () => {
    const east = modelOrientationFromBearing(90);
    expect(east.rotateX).toBeCloseTo(Math.PI / 2, 6);
    expect(east.rotateZ).toBe(0);
    expect(east.rotateY).toBeCloseTo(-Math.PI / 2, 6);
    expect(modelYawRadFromBearing(0)).toBeCloseTo(0, 6);
  });
});
