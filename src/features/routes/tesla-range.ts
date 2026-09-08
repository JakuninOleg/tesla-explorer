/**
 * EPA-ish planning constants — not live vehicle telemetry.
 * Injected into Go-Ai prompts so Gemini does not invent Wh/mi.
 */
export type TeslaRangeProfile = {
  model: string;
  usableKwh: number;
  whPerMile: number;
};

const PROFILES: TeslaRangeProfile[] = [
  { model: "Model 3", usableKwh: 57.5, whPerMile: 250 },
  { model: "Model Y", usableKwh: 75, whPerMile: 280 },
  { model: "Model S", usableKwh: 95, whPerMile: 290 },
  { model: "Model X", usableKwh: 95, whPerMile: 320 },
  { model: "Cybertruck", usableKwh: 120, whPerMile: 370 },
];

const DEFAULT_PROFILE: TeslaRangeProfile = {
  model: "Model Y",
  usableKwh: 75,
  whPerMile: 280,
};

export function getTeslaRangeProfile(model: string): TeslaRangeProfile {
  const normalized = model.trim().toLowerCase();
  return (
    PROFILES.find((entry) => entry.model.toLowerCase() === normalized) ??
    DEFAULT_PROFILE
  );
}

export type RangeBudget = {
  model: string;
  batteryPercent: number;
  reservePercent: number;
  usableKwh: number;
  whPerMile: number;
  grossMiles: number;
  budgetMiles: number;
  summary: string;
};

export function estimateRangeMiles(options: {
  model: string;
  batteryPercent: number;
  reservePercent?: number;
}): RangeBudget {
  const reservePercent = options.reservePercent ?? 15;
  const profile = getTeslaRangeProfile(options.model);
  const batteryPercent = Math.min(100, Math.max(1, options.batteryPercent));
  const energyKwh = (profile.usableKwh * batteryPercent) / 100;
  const grossMiles = Math.floor((energyKwh * 1000) / profile.whPerMile);
  const budgetMiles = Math.max(
    0,
    Math.floor(grossMiles * (1 - reservePercent / 100)),
  );

  return {
    model: profile.model,
    batteryPercent,
    reservePercent,
    usableKwh: profile.usableKwh,
    whPerMile: profile.whPerMile,
    grossMiles,
    budgetMiles,
    summary: `${profile.model} at ${batteryPercent}% ≈ ${grossMiles} mi gross, ~${budgetMiles} mi planning budget after ${reservePercent}% reserve (EPA-ish ${profile.whPerMile} Wh/mi; not live car data).`,
  };
}

export function sumApproxDriveMiles(
  stops: Array<{ approxDriveMiles?: number }>,
): number {
  return stops.reduce((sum, stop) => sum + (stop.approxDriveMiles ?? 0), 0);
}

export function buildRangeWarning(
  budgetMiles: number,
  plannedDriveMiles: number,
): string | null {
  if (plannedDriveMiles <= budgetMiles) {
    return null;
  }
  return `Planned driving ~${plannedDriveMiles} mi exceeds ~${budgetMiles} mi budget — charge stop recommended or shorten the loop.`;
}
