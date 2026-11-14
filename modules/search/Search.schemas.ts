import { z } from "zod";

/** Public search query; `q` is optional (short/missing values short-circuit in the service). */
export const searchQuerySchema = z.object({
  q: z.string().optional(),
});
