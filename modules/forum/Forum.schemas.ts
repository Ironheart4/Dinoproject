import { z } from "zod";

export const POST_TITLE_MAX = 200;
export const POST_CONTENT_MAX = 10000;

export const CREATE_POST_REQUIRED_MESSAGE = "categoryId, title, and content are required";
export const CREATE_POST_LENGTH_MESSAGE =
  "Title must be 200 characters or fewer and content 10,000 characters or fewer";
export const CREATE_REPLY_REQUIRED_MESSAGE = "Content is required";
export const CREATE_REPLY_LENGTH_MESSAGE = "Content must be 10,000 characters or fewer";

/** No query fields; unknown keys are ignored (same as before). */
export const forumEmptyQuerySchema = z.object({});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1, "Invalid category slug"),
});
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;

export const postIdParamsSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0;
      },
      { message: "Invalid post id" },
    )
    .transform((value) => Number(value)),
});
export type PostIdParams = z.infer<typeof postIdParamsSchema>;

function toPositiveInt(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Same order of checks as the old route: required fields first, then lengths.
 * Title and content are stored trimmed.
 */
export const createPostBodySchema = z
  .object({ categoryId: z.unknown(), title: z.unknown(), content: z.unknown() })
  .transform((body, ctx) => {
    const categoryId = toPositiveInt(body.categoryId);
    const { title, content } = body;
    if (
      !categoryId ||
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: CREATE_POST_REQUIRED_MESSAGE });
      return z.NEVER;
    }
    if (title.trim().length > POST_TITLE_MAX || content.trim().length > POST_CONTENT_MAX) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: CREATE_POST_LENGTH_MESSAGE });
      return z.NEVER;
    }
    return { categoryId, title: title.trim(), content: content.trim() };
  });
export type CreatePostBody = z.infer<typeof createPostBodySchema>;

export const createReplyBodySchema = z
  .object({ content: z.unknown() })
  .transform((body, ctx) => {
    const { content } = body;
    if (typeof content !== "string" || !content.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: CREATE_REPLY_REQUIRED_MESSAGE });
      return z.NEVER;
    }
    if (content.trim().length > POST_CONTENT_MAX) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: CREATE_REPLY_LENGTH_MESSAGE });
      return z.NEVER;
    }
    return { content: content.trim() };
  });
export type CreateReplyBody = z.infer<typeof createReplyBodySchema>;
