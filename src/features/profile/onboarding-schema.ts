import { z } from "zod";

const optionalCoord = z
  .coerce.number()
  .nullable()
  .optional()
  .transform((value) => (value == null || Number.isNaN(value) ? null : value));

export const onboardingSchema = z
  .object({
    homeAddress: z
      .string()
      .trim()
      .min(5, "Enter a full home address")
      .max(200),
    homeLat: optionalCoord,
    homeLng: optionalCoord,
    workAddress: z
      .string()
      .trim()
      .min(5, "Enter a full work / office address")
      .max(200),
    workLat: optionalCoord,
    workLng: optionalCoord,
    household: z.enum(["solo", "family"]),
    kidsCount: z.coerce.number().int().min(0).max(8).default(0),
    aboutMe: z.string().trim().max(280).optional().default(""),
    interests: z
      .string()
      .trim()
      .min(2, "Share a few interests")
      .max(240),
    teslaModel: z
      .string()
      .trim()
      .min(1, "Select a model")
      .max(40),
  })
  .superRefine((value, ctx) => {
    for (const [key, coord] of [
      ["homeLat", value.homeLat],
      ["workLat", value.workLat],
    ] as const) {
      if (coord != null && (coord < -90 || coord > 90)) {
        ctx.addIssue({ code: "custom", message: "Invalid latitude", path: [key] });
      }
    }
    for (const [key, coord] of [
      ["homeLng", value.homeLng],
      ["workLng", value.workLng],
    ] as const) {
      if (coord != null && (coord < -180 || coord > 180)) {
        ctx.addIssue({ code: "custom", message: "Invalid longitude", path: [key] });
      }
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const TESLA_MODELS = [
  "Model 3",
  "Model Y",
  "Model S",
  "Model X",
  "Cybertruck",
] as const;
