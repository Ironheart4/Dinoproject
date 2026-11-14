import { z } from "zod";

export const PASSWORD_MIN = 6;
export const NAME_MAX = 100;
export const REGISTER_REQUIRED_MESSAGE = "name, email, password required";
export const PASSWORD_TOO_SHORT_MESSAGE = "Password must be at least 6 characters";
export const INVALID_EMAIL_MESSAGE = "Invalid email format";
export const NAME_TOO_LONG_MESSAGE = "Name must be 100 characters or fewer";
export const LOGIN_REQUIRED_MESSAGE = "email and password required";
export const REFRESH_REQUIRED_MESSAGE = "Refresh token required";

/** No query fields; unknown keys are ignored (same as before). */
export const authEmptyQuerySchema = z.object({});

const isFilled = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** Same order of checks as the old route: required, then password length, then email format. */
export const registerBodySchema = z
  .object({ name: z.unknown(), email: z.unknown(), password: z.unknown() })
  .transform((body, ctx) => {
    const { name, email, password } = body;
    const fail = (message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      return z.NEVER;
    };
    if (!isFilled(name) || !isFilled(email) || !isFilled(password)) return fail(REGISTER_REQUIRED_MESSAGE);
    if (password.length < PASSWORD_MIN) return fail(PASSWORD_TOO_SHORT_MESSAGE);
    if (!email.includes("@")) return fail(INVALID_EMAIL_MESSAGE);
    if (name.length > NAME_MAX) return fail(NAME_TOO_LONG_MESSAGE);
    return { name, email, password };
  });
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z
  .object({ email: z.unknown(), password: z.unknown() })
  .transform((body, ctx) => {
    if (!isFilled(body.email) || !isFilled(body.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: LOGIN_REQUIRED_MESSAGE });
      return z.NEVER;
    }
    return { email: body.email, password: body.password };
  });
export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z
  .object({ refreshToken: z.unknown() })
  .transform((body, ctx) => {
    if (!isFilled(body.refreshToken)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: REFRESH_REQUIRED_MESSAGE });
      return z.NEVER;
    }
    return { refreshToken: body.refreshToken };
  });
export type RefreshBody = z.infer<typeof refreshBodySchema>;
