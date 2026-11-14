import { z } from "zod";

/** Authenticated subscription routes with no query input. */
export const subscriptionEmptyQuerySchema = z.object({});

/** Admin create/upsert; plan required — use fallbackMessage "plan required". */
export const createSubscriptionBodySchema = z.object({
  plan: z.string().min(1),
  paypalSubscriptionId: z.string().optional(),
});
