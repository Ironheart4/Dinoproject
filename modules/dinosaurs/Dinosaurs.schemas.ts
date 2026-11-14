import { z } from "zod";

/** Matches legacy parsePositiveInt on `:id`. */
export const dinosaurIdParamsSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0;
      },
      { message: "Invalid dinosaur id" },
    )
    .transform((value) => Number(value)),
});

export type DinosaurIdParams = z.infer<typeof dinosaurIdParamsSchema>;

/** No query fields; unknown keys are ignored (same as before). */
export const dinosaursEmptyQuerySchema = z.object({});

const optionalText = z.string().nullish();
const optionalNumeric = z.union([z.string(), z.number()]).nullish();

export const DINOSAUR_REQUIRED_MESSAGE = "'name' and 'species' are required";

/**
 * Create and update share one body shape (legacy behavior: both require name and species).
 * `name` / `species` use a custom message so the 400 text matches the legacy route.
 */
export const dinosaurBodySchema = z.object({
  name: z.string({ required_error: DINOSAUR_REQUIRED_MESSAGE }).min(1, DINOSAUR_REQUIRED_MESSAGE),
  species: z.string({ required_error: DINOSAUR_REQUIRED_MESSAGE }).min(1, DINOSAUR_REQUIRED_MESSAGE),
  period: optionalText,
  diet: optionalText,
  habitat: optionalText,
  lengthMeters: optionalNumeric,
  weightKg: optionalNumeric,
  description: optionalText,
  modelUrl: optionalText, // required column in the database; blank becomes "DEV_PENDING"
  roarSound: optionalText,
  imageUrl: optionalText,
  imageUrl1: optionalText,
  imageUrl2: optionalText,
  imageUrl3: optionalText,
  imageUrl4: optionalText,
  imageUrl5: optionalText,
  videoUrl: optionalText,
  wikipedia: optionalText,
  taxonomy: optionalText,
  type: optionalText,
  livedIn: optionalText,
  namedBy: optionalText,
});

export type DinosaurBody = z.infer<typeof dinosaurBodySchema>;
