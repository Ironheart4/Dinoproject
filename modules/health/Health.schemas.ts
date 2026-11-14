import { z } from "zod";

/**
 * Health endpoints take no body/params/query input.
 * Empty-object schemas document that contract for validateRequest.
 */
/** No required query fields; unknown keys are ignored (same as before). */
export const healthEmptyQuerySchema = z.object({});
