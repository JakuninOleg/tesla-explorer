import type { OnboardingInput } from "@/features/profile/onboarding-schema";

export type PastRouteMemory = {
  title: string;
  rating: number;
  impressionNotes: string | null;
  preferenceNotes: string | null;
  requestPrompt: string;
};

export function buildPlanSystemPrompt(): string {
  return [
    "You are Tesla Explorer's route planner for leisure drives in the USA.",
    "Plan realistic stops for a Tesla driver based on home base, time, battery, household, and interests.",
    "Prefer Supercharger-aware pacing when charge is low; do not invent fake booking flows.",
    "Learn from the driver's past ratings and notes when provided.",
    "Respond with JSON only — no markdown — matching this shape:",
    '{"title":"string","summary":"string","stops":[{"name":"string","kind":"scenic|food|charge|activity|viewpoint|other","reason":"string","approxMinutes":number,"lat":number?,"lng":number?}]}',
    "Include 2–8 stops. approxMinutes is time at/for that stop, not drive time.",
    "Optional lat/lng must be approximate WGS84 for the USA when known.",
  ].join(" ");
}

export function buildPlanUserPrompt(options: {
  profile: OnboardingInput;
  requestPrompt: string;
  availableHours: number;
  batteryPercent: number;
  pastRoutes: PastRouteMemory[];
}): string {
  const { profile, requestPrompt, availableHours, batteryPercent, pastRoutes } =
    options;

  const lines = [
    `Home base: ${profile.homePlace}`,
    `Household: ${profile.household}`,
    `Interests: ${profile.interests}`,
    `Tesla: ${profile.teslaModel}`,
    `Battery now: ${batteryPercent}%`,
    `Available hours: ${availableHours}`,
    `Request: ${requestPrompt}`,
  ];

  if (pastRoutes.length === 0) {
    lines.push("Past rated routes: none yet.");
  } else {
    lines.push("Past rated routes (newest first):");
    for (const route of pastRoutes) {
      const impression = route.impressionNotes?.trim() || "—";
      const preference = route.preferenceNotes?.trim() || "—";
      lines.push(
        `- "${route.title}" (was: ${route.requestPrompt}) rating ${route.rating}/5; impressions: ${impression}; prefer next time: ${preference}`,
      );
    }
  }

  return lines.join("\n");
}
