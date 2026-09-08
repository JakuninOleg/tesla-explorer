import { describe, expect, it } from "vitest";
import {
  buildRangeWarning,
  estimateRangeMiles,
  sumApproxDriveMiles,
} from "@/features/routes/tesla-range";

describe("tesla range estimator", () => {
  it("computes a planning budget with reserve", () => {
    const budget = estimateRangeMiles({
      model: "Model Y",
      batteryPercent: 50,
      reservePercent: 15,
    });

    expect(budget.whPerMile).toBe(280);
    expect(budget.grossMiles).toBeGreaterThan(0);
    expect(budget.budgetMiles).toBeLessThan(budget.grossMiles);
    expect(budget.summary).toMatch(/FACT|EPA-ish|budget/i);
  });

  it("warns when planned miles exceed budget", () => {
    expect(buildRangeWarning(80, 120)).toMatch(/exceeds/);
    expect(buildRangeWarning(80, 70)).toBeNull();
  });

  it("sums approx drive miles", () => {
    expect(
      sumApproxDriveMiles([
        { approxDriveMiles: 0 },
        { approxDriveMiles: 12 },
        { approxDriveMiles: 8 },
      ]),
    ).toBe(20);
  });
});
