import { z } from "zod";

export const NAME_MAX = 100;
export const BIO_MAX = 2000;

/** No query fields; unknown keys are ignored (same as before). */
export const profileEmptyQuerySchema = z.object({});

/**
 * Same rules as the old route: an empty name is ignored, `bio` may be any string or null.
 * Added limits match the database (name is VARCHAR(100)).
 */
export const updateProfileBodySchema = z.object({
  name: z.string().max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer`).optional(),
  bio: z.string().max(BIO_MAX, `Bio must be ${BIO_MAX} characters or fewer`).nullish(),
});
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;
export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;
