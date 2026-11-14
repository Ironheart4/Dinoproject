import { z } from "zod";

/** The dashboard routes take no query fields; unknown keys are ignored (same as before). */
export const dashboardEmptyQuerySchema = z.object({});
