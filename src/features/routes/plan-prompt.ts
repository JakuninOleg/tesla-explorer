import type { OnboardingInput } from "@/features/profile/onboarding-schema";
import type { PlanRouteInput } from "@/features/routes/itinerary-schema";
import type { RangeBudget } from "@/features/routes/tesla-range";

export type PastRouteMemory = {
  title: string;
  rating: number;
  impressionNotes: string | null;
  preferenceNotes: string | null;
  requestPrompt: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export function buildPlanSystemPrompt(): string {
  return [
    "You are Tesla Explorer's route planner for leisure drives in the USA.",
    "Respect the driver's Home and Work anchors as real addresses.",
    "Natural language like 'from office home for kids then explore' means must legs via those anchors, then leisure.",
    "Use the injected range budget as FACT — do not invent a different Wh/mi or total range.",
    "If planned driving would exceed the budget, include a Supercharger (role charge) or shorten explore legs.",
    "Mark each stop role as must | explore | charge.",
    "Respond with JSON only — no markdown — matching:",
    '{"title":"string","summary":"string","stops":[{"name":"string","kind":"scenic|food|charge|activity|viewpoint|other|anchor","role":"must|explore|charge","reason":"string","approxMinutes":number,"approxDriveMiles":number,"lat":number?,"lng":number?}]}',
    "Include 2–8 stops. approxDriveMiles is miles driven TO that stop from the previous point (0 for the start).",
    "approxMinutes is dwell time at the stop (not drive time); use 0 for return-home / pass-through anchors.",
    "Optional lat/lng must be approximate WGS84 in the USA when known.",
  ].join(" ");
}

export function buildChatSystemPrompt(): string {
  return [
    "You are the driver's personal leisure-route co-pilot inside Tesla Explorer.",
    "You already know their home, work, Tesla model, household, kids, and about-me notes from context.",
    "Speak like a sharp friend who plans unforgettable short drives in the USA — warm, concrete, concise.",
    "Ask at most ONE clarifying question when battery %, free hours, or start (home/work/other) is still unclear.",
    "When you have enough to plan, respond with JSON ONLY (no markdown fences) matching:",
    '{"title":"string","summary":"string","stops":[{"name":"string","kind":"scenic|food|charge|activity|viewpoint|other|anchor","role":"must|explore|charge","reason":"string","approxMinutes":number,"approxDriveMiles":number,"lat":number?,"lng":number?,"youtubeVideoId":"optional public id"}]}',
    "Include real-ish lat/lng for each stop so the 3D map cinema works. 2–8 stops.",
    "When you know a real public YouTube video id for a food/activity stop, set youtubeVideoId (11-ish chars).",
    "approxMinutes may be 0 for return-home anchors. Prefer food/activity/scenic that fit kids when kidsCount > 0.",
    "Use the RANGE BUDGET as FACT. Never invent different Wh/mi.",
  ].join(" ");
}

function formatAnchor(
  label: string,
  address: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  const coords =
    lat != null && lng != null ? ` (${lat.toFixed(5)}, ${lng.toFixed(5)})` : "";
  return `${label}: ${address}${coords}`;
}

export function resolveStartLabel(options: {
  profile: OnboardingInput;
  input: PlanRouteInput;
}): string {
  const { profile, input } = options;
  if (input.startAnchor === "home") {
    return formatAnchor("Start (home)", profile.homeAddress, profile.homeLat, profile.homeLng);
  }
  if (input.startAnchor === "work") {
    return formatAnchor("Start (work)", profile.workAddress, profile.workLat, profile.workLng);
  }
  return formatAnchor(
    "Start (other)",
    input.startOtherText || "unspecified",
    input.startOtherLat,
    input.startOtherLng,
  );
}

export function buildDriverContextBlock(options: {
  profile: OnboardingInput;
  range: RangeBudget;
  pastRoutes: PastRouteMemory[];
  startAnchor: PlanRouteInput["startAnchor"];
  startOtherText?: string;
  batteryPercent: number;
  availableHours: number;
}): string {
  const { profile, range, pastRoutes } = options;
  const lines = [
    "DRIVER CONTEXT (trusted facts):",
    formatAnchor("Home", profile.homeAddress, profile.homeLat, profile.homeLng),
    formatAnchor("Work", profile.workAddress, profile.workLat, profile.workLng),
    `Preferred start anchor: ${options.startAnchor}${
      options.startOtherText ? ` (${options.startOtherText})` : ""
    }`,
    `Household: ${profile.household}`,
    `Kids count: ${profile.kidsCount ?? 0}`,
    `About driver: ${profile.aboutMe?.trim() || "—"}`,
    `Interests: ${profile.interests}`,
    `Tesla: ${profile.teslaModel}`,
    `Battery now: ${options.batteryPercent}%`,
    `Available hours: ${options.availableHours}`,
    `RANGE BUDGET (FACT): ${range.summary}`,
  ];

  if (pastRoutes.length === 0) {
    lines.push("Past approved+rated routes: none yet.");
  } else {
    lines.push("Past approved+rated routes (newest first):");
    for (const route of pastRoutes) {
      lines.push(
        `- "${route.title}" rating ${route.rating}/5; prefer next: ${route.preferenceNotes?.trim() || "—"}`,
      );
    }
  }

  return lines.join("\n");
}

export function buildPlanUserPrompt(options: {
  profile: OnboardingInput;
  input: PlanRouteInput;
  range: RangeBudget;
  pastRoutes: PastRouteMemory[];
}): string {
  const { profile, input, range, pastRoutes } = options;

  const lines = [
    formatAnchor("Home", profile.homeAddress, profile.homeLat, profile.homeLng),
    formatAnchor("Work", profile.workAddress, profile.workLat, profile.workLng),
    resolveStartLabel({ profile, input }),
    `Household: ${profile.household}`,
    `Kids count: ${profile.kidsCount ?? 0}`,
    `About driver: ${profile.aboutMe?.trim() || "—"}`,
    `Interests: ${profile.interests}`,
    `Tesla: ${profile.teslaModel}`,
    `Battery now: ${input.batteryPercent}%`,
    `Available hours: ${input.availableHours}`,
    `RANGE BUDGET (FACT — use this): ${range.summary}`,
    `Request: ${input.requestPrompt}`,
  ];

  if (input.adjustNotes?.trim()) {
    lines.push(`Adjust feedback: ${input.adjustNotes.trim()}`);
  }

  if (pastRoutes.length === 0) {
    lines.push("Past approved+rated routes: none yet.");
  } else {
    lines.push("Past approved+rated routes (newest first):");
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

export function buildChatGreeting(options: {
  displayName: string;
  profile: OnboardingInput;
}): string {
  const kids =
    (options.profile.kidsCount ?? 0) > 0
      ? ` I see ${options.profile.kidsCount} kid(s) in the cabin.`
      : "";
  return `Hey ${options.displayName} — ready when you are. You're in a ${options.profile.teslaModel}.${kids} Tell me the vibe (food, views, kids energy), roughly how many hours you have, and whether we start from home or work. I'll craft a route you can approve and play on the 3D map.`;
}
