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

export const itineraryStopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: stopKindSchema,
  role: stopRoleSchema.default("explore"),
  reason: z.string().trim().min(1).max(400),
  approxMinutes: z.number().int().min(5).max(480),
  approxDriveMiles: z.number().min(0).max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const itinerarySchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(600),
  stops: z.array(itineraryStopSchema).min(1).max(12),
});

export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

export const startAnchorSchema = z.enum(["home", "work", "other"]);

export const planRouteInputSchema = z
  .object({
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
  })
  .superRefine((value, ctx) => {
    if (value.startAnchor === "other" && value.startOtherText.trim().length < 5) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a start address",
        path: ["startOtherText"],
      });
    }
  });

export type PlanRouteInput = z.infer<typeof planRouteInputSchema>;

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

export function parseItineraryResponse(text: string): Itinerary {
  const raw = extractJsonObject(text);
  return itinerarySchema.parse(raw);
}
