import { z } from "zod";

export const MESSAGE_MAX = 2000;
export const MESSAGE_REQUIRED = "Message is required";
export const MESSAGE_TOO_LONG = "Message must be 2,000 characters or fewer";

/** Same checks as the old route: a non-empty string of at most 2,000 characters. */
export const chatBodySchema = z
  .object({ message: z.unknown() })
  .transform((body, ctx) => {
    const { message } = body;
    if (typeof message !== "string" || !message.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_REQUIRED });
      return z.NEVER;
    }
    if (message.length > MESSAGE_MAX) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_TOO_LONG });
      return z.NEVER;
    }
    return { message };
  });
export type ChatBody = z.infer<typeof chatBodySchema>;
