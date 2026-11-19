import { z } from "zod";

/** No required query fields; unknown keys are ignored (same as before). */
export const scoresEmptyQuerySchema = z.object({});

/**
 * Matches the legacy positive-integer quiz id and bounded integer score rules.
 * Use with validateRequest fallbackMessage for the exact 400 string.
 */
export const createScoreBodySchema = z.object({
  quizId: z.union([z.string(), z.number()]).refine(
    (value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0;
    },
    { message: "quizId must be a positive integer and score must be an integer from 0 to 100" },
  ).transform((value) => Number(value)),
  score: z.union([z.string(), z.number()]).refine(
    (value) => {
      const parsed = Number(value);
      return (
        Number.isFinite(parsed) &&
        parsed >= 0 &&
        parsed <= 100 &&
        Number.isInteger(parsed)
      );
    },
    { message: "quizId must be a positive integer and score must be an integer from 0 to 100" },
  ).transform((value) => Number(value)),
});

export type CreateScoreBody = z.infer<typeof createScoreBodySchema>;

/** Exact client-facing message from the legacy scores route. */
export const CREATE_SCORE_VALIDATION_MESSAGE =
  "quizId must be a positive integer and score must be an integer from 0 to 100";
