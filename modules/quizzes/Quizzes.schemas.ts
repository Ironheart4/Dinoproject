import { z } from "zod";

const positiveInt = (message: string) =>
  z
    .union([z.string(), z.number()])
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0;
      },
      { message },
    )
    .transform((value) => Number(value));

/** Matches legacy parsePositiveInt on `:id`. */
export const quizIdParamsSchema = z.object({ id: positiveInt("Invalid quiz id") });
export type QuizIdParams = z.infer<typeof quizIdParamsSchema>;

/** No query fields; unknown keys are ignored (same as before). */
export const quizzesEmptyQuerySchema = z.object({});

export const MAX_RANDOM_QUESTIONS = 100;
const DEFAULT_RANDOM_QUESTIONS = 10;

/**
 * Legacy rule: `parsePositiveInt(count) || 10`, then reject values above 100.
 * A missing or invalid `count` falls back to the default of 10.
 */
export const randomQuestionsQuerySchema = z
  .object({ count: z.unknown().optional() })
  .transform((query, ctx) => {
    const raw = query.count;
    const parsed =
      (typeof raw === "string" || typeof raw === "number") &&
      Number.isInteger(Number(raw)) &&
      Number(raw) > 0
        ? Number(raw)
        : DEFAULT_RANDOM_QUESTIONS;
    if (parsed > MAX_RANDOM_QUESTIONS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "count must be 100 or fewer" });
      return z.NEVER;
    }
    return { count: parsed };
  });
export type RandomQuestionsQuery = z.infer<typeof randomQuestionsQuerySchema>;

export const QUESTION_TYPES = ["text", "image", "identify"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DEFAULT_QUESTION_TYPE = "text";
export const DEFAULT_DIFFICULTY = "medium";

/** One quiz question. Type, image and difficulty live on the quiz, not on each question. */
export const questionInputSchema = z.object({
  questionText: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Quiz-level presentation fields (stored on the quizzes table). All optional; an empty image URL means "none". */
const quizPresentationShape = {
  questionType: z.enum(QUESTION_TYPES).nullish(),
  imageUrl: z
    .string()
    .max(1000)
    .nullish()
    .transform((value) => (value === "" ? null : value)),
  difficulty: z.enum(DIFFICULTIES).nullish(),
};

export const QUIZ_TITLE_REQUIRED_MESSAGE = "title required";
export const QUIZ_BODY_INVALID_MESSAGE = "Invalid quiz payload";

export const createQuizBodySchema = z.object({
  title: z.string({ required_error: QUIZ_TITLE_REQUIRED_MESSAGE }).min(1, QUIZ_TITLE_REQUIRED_MESSAGE).max(200),
  questions: z.array(questionInputSchema).optional(),
  ...quizPresentationShape,
});
export type CreateQuizBody = z.infer<typeof createQuizBodySchema>;

/** On update every field is optional; omitted fields stay unchanged. */
export const updateQuizBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  questions: z.array(questionInputSchema).optional(),
  ...quizPresentationShape,
});
export type UpdateQuizBody = z.infer<typeof updateQuizBodySchema>;
