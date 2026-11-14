import { z } from "zod";

/** Admin list users; no query input. */
export const usersEmptyQuerySchema = z.object({});

export const updateUserRoleParamsSchema = z.object({
  id: z.string().min(1),
});

/** Body role must be user|admin; use fallbackMessage for exact 400 text. */
export const updateUserRoleBodySchema = z.object({
  role: z.enum(["user", "admin"]),
});
