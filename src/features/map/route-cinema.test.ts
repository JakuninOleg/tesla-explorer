import { describe, expect, it } from "vitest";
import { pointAlongLine } from "@/features/map/route-geometry";

describe("cinema playback helpers", () => {
  it("moves the car marker along the full line", () => {
    const line: [number, number][] = [
      [-82.5, 27.9],
      [-82.4, 28.0],
      [-82.3, 28.1],
    ];
    expect(pointAlongLine(line, 0)?.[0]).toBeCloseTo(-82.5, 3);
    expect(pointAlongLine(line, 1)?.[0]).toBeCloseTo(-82.3, 3);
    const mid = pointAlongLine(line, 0.5);
    expect(mid?.[0]).toBeGreaterThan(-82.5);
    expect(mid?.[0]).toBeLessThan(-82.3);
  });
});
