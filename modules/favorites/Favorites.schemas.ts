import { z } from "zod";
import { parsePositiveInt } from "../../middleware/validate";

/**
 * Path param `:dinoId` — same acceptance rules as legacy `parsePositiveInt`.
 */
export const favoriteDinoIdParamsSchema = z.object({
  dinoId: z.string().superRefine((value, ctx) => {
    if (parsePositiveInt(value) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid dinosaur id",
      });
    }
  }).transform((value) => parsePositiveInt(value)!),
});

export type FavoriteDinoIdParams = z.infer<typeof favoriteDinoIdParamsSchema>;

/**
 * POST body accepts `dinoId` or `dinosaurId` (legacy `dinoId || dinosaurId`).
 */
export const addFavoriteBodySchema = z
  .object({
    dinoId: z.unknown().optional(),
    dinosaurId: z.unknown().optional(),
  })
  .superRefine((body, ctx) => {
    if (parsePositiveInt(body.dinoId || body.dinosaurId) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid dinoId or dinosaurId required",
      });
    }
  })
  .transform((body) => ({
    dinoId: parsePositiveInt(body.dinoId || body.dinosaurId)!,
  }));

export type AddFavoriteBody = z.infer<typeof addFavoriteBodySchema>;
