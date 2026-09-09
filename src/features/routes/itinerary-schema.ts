import { z } from "zod";

export const stopKindSchema = z.enum([
  "scenic",
  "food",
  "charge",
  "activity",
  "viewpoint",
  "other",
  "anchor",
]);

export const stopRoleSchema = z.enum(["must", "explore", "charge"]);

const kindFromUnknown = z.preprocess((value) => {
  if (typeof value !== "string") {
    return "other";
  }
  const normalized = value.trim().toLowerCase();
  if (stopKindSchema.options.includes(normalized as z.infer<typeof stopKindSchema>)) {
    return normalized;
  }
  if (/(food|dine|dining|restaurant|bbq|cafe)/i.test(normalized)) {
    return "food";
  }
  if (/(park|lake|scenic|view)/i.test(normalized)) {
    return "scenic";
  }
  if (/(charge|supercharger)/i.test(normalized)) {
    return "charge";
  }
  if (/(home|work|origin|destination|anchor)/i.test(normalized)) {
    return "anchor";
  }
  if (/(play|walk|activ)/i.test(normalized)) {
    return "activity";
  }
  return "other";
}, stopKindSchema);

const roleFromUnknown = z.preprocess((value) => {
  if (typeof value !== "string") {
    return "explore";
  }
  const normalized = value.trim().toLowerCase();
  if (stopRoleSchema.options.includes(normalized as z.infer<typeof stopRoleSchema>)) {
    return normalized;
  }
  if (/(must|origin|destination|home|work)/i.test(normalized)) {
    return "must";
  }
  if (/charge/i.test(normalized)) {
    return "charge";
  }
  return "explore";
}, stopRoleSchema);

const optionalYoutubeId = z.preprocess((value) => {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{6,20}$/.test(trimmed) ? trimmed : undefined;
}, z.string().optional());

export const itineraryStopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: kindFromUnknown,
  role: roleFromUnknown.default("explore"),
  reason: z
    .preprocess((value) => {
      if (typeof value !== "string" || !value.trim()) {
        return "Stop on the leisure route.";
      }
      return value.trim().slice(0, 400);
    }, z.string().min(1).max(400)),
  /** 0 is valid for pass-through / return-home anchors (no dwell). */
  approxMinutes: z.coerce.number().int().min(0).max(480),
  approxDriveMiles: z.coerce.number().min(0).max(500).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  youtubeVideoId: optionalYoutubeId,
});

export const itinerarySchema = z.object({
  title: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim()
        ? value.trim().slice(0, 120)
        : "Leisure drive",
    z.string().min(1).max(120),
  ),
  summary: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim()
        ? value.trim().slice(0, 600)
        : "A short leisure drive for your Tesla.",
    z.string().min(1).max(600),
  ),
  stops: z.array(itineraryStopSchema).min(1).max(12),
});

export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

export const startAnchorSchema = z.enum(["home", "work", "other"]);

/** Base fields without refinements — safe to `.pick()`. */
export const planRouteFieldsSchema = z.object({
  requestPrompt: z
    .string()
    .trim()
    .min(8, "Describe what you want from this drive")
    .max(800),
  availableHours: z.coerce.number().int().min(1).max(16),
  batteryPercent: z.coerce.number().int().min(1).max(100),
  startAnchor: startAnchorSchema,
  startOtherText: z.string().trim().max(200).optional().default(""),
  startOtherLat: z.coerce.number().min(-90).max(90).nullable().optional(),
  startOtherLng: z.coerce.number().min(-180).max(180).nullable().optional(),
  adjustOfRouteId: z.string().uuid().optional(),
  adjustNotes: z.string().trim().max(800).optional(),
});

export const planRouteInputSchema = planRouteFieldsSchema.superRefine(
  (value, ctx) => {
    if (value.startAnchor === "other" && value.startOtherText.trim().length < 5) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a start address",
        path: ["startOtherText"],
      });
    }
  },
);

/** Hours / battery / start for chat planner (no requestPrompt yet). */
export const chatTripMetaSchema = planRouteFieldsSchema.pick({
  availableHours: true,
  batteryPercent: true,
  startAnchor: true,
  startOtherText: true,
  startOtherLat: true,
  startOtherLng: true,
});

export type PlanRouteInput = z.infer<typeof planRouteInputSchema>;
export type ChatTripMeta = z.infer<typeof chatTripMetaSchema>;

export const rateRouteInputSchema = z.object({
  routeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  impressionNotes: z.string().trim().max(800).optional().default(""),
  preferenceNotes: z.string().trim().max(800).optional().default(""),
});

export type RateRouteInput = z.infer<typeof rateRouteInputSchema>;

export const routeIdSchema = z.object({
  routeId: z.string().uuid(),
});

/** Extract JSON object from model text (raw or fenced). */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

/**
 * Normalize alternate LLM shapes (e.g. `itinerary[]` + coordinates) into our schema.
 */
export function normalizeItineraryPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.stops)) {
    return obj;
  }

  const alt = obj.itinerary;
  if (!Array.isArray(alt)) {
    return obj;
  }

  const stops = alt.map((entry) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const coords = (item.coordinates ?? {}) as Record<string, unknown>;
    const drive = (item.drive_from_previous ?? {}) as Record<string, unknown>;
    const type = typeof item.type === "string" ? item.type : "other";
    const lat =
      typeof item.lat === "number"
        ? item.lat
        : typeof coords.latitude === "number"
          ? coords.latitude
          : undefined;
    const lng =
      typeof item.lng === "number"
        ? item.lng
        : typeof coords.longitude === "number"
          ? coords.longitude
          : undefined;
    const minutes =
      typeof item.approxMinutes === "number"
        ? item.approxMinutes
        : typeof item.dwell_time_minutes === "number"
          ? item.dwell_time_minutes
          : 0;
    const miles =
      typeof item.approxDriveMiles === "number"
        ? item.approxDriveMiles
        : typeof drive.distance_miles === "number"
          ? drive.distance_miles
          : undefined;
    const reason =
      typeof item.reason === "string"
        ? item.reason
        : typeof item.notes === "string"
          ? item.notes
          : typeof item.address === "string"
            ? item.address
            : "Stop on the leisure route.";

    return {
      name: item.name ?? "Stop",
      kind: item.kind ?? type,
      role: item.role ?? type,
      reason,
      approxMinutes: minutes,
      approxDriveMiles: miles,
      lat,
      lng,
      youtubeVideoId: item.youtubeVideoId,
    };
  });

  const summary =
    typeof obj.summary === "string"
      ? obj.summary
      : typeof obj.title === "string"
        ? `${obj.title} — planned leisure loop.`
        : "A short leisure drive for your Tesla.";

  return {
    title: obj.title ?? "Leisure drive",
    summary,
    stops,
  };
}

export function parseItineraryResponse(text: string): Itinerary {
  const raw = extractJsonObject(text);
  return itinerarySchema.parse(normalizeItineraryPayload(raw));
}
