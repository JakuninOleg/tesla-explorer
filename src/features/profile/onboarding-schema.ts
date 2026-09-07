import { z } from "zod";

export const onboardingSchema = z.object({
  homePlace: z
    .string()
    .trim()
    .min(2, "Enter a city or address")
    .max(120),
  household: z.enum(["solo", "family"]),
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
  batteryPercent: z.coerce
    .number()
    .int()
    .min(1, "Battery must be at least 1%")
    .max(100, "Battery cannot exceed 100%"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const TESLA_MODELS = [
  "Model 3",
  "Model Y",
  "Model S",
  "Model X",
  "Cybertruck",
] as const;
