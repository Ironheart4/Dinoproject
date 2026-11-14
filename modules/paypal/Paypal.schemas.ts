import { z } from "zod";

export const PAYPAL_PLANS = ["premium_monthly", "premium_yearly", "donor"] as const;
export type PaypalPlan = (typeof PAYPAL_PLANS)[number];

export const DONOR_MIN = 5;
export const DONOR_MAX = 10000;
export const INVALID_PLAN_MESSAGE = "Invalid plan";
export const INVALID_DONOR_AMOUNT_MESSAGE = "Donor amount must be a number between 5.00 and 10000.00 USD";
export const INVALID_ORDER_ID_MESSAGE = "Valid orderId required";

/** No query fields; unknown keys are ignored (same as before). */
export const paypalEmptyQuerySchema = z.object({});

function parseBounded(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

/** Checks the plan first, then (for donations) the amount: 5.00 to 10000.00, default 5.00. */
export const createOrderBodySchema = z
  .object({ plan: z.unknown(), amount: z.unknown().optional() })
  .transform((body, ctx) => {
    if (typeof body.plan !== "string" || !PAYPAL_PLANS.includes(body.plan as PaypalPlan)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: INVALID_PLAN_MESSAGE });
      return z.NEVER;
    }
    const plan = body.plan as PaypalPlan;
    if (plan !== "donor") return { plan, donorAmount: undefined };

    const donorAmount = parseBounded(body.amount ?? "5.00", DONOR_MIN, DONOR_MAX);
    if (donorAmount === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: INVALID_DONOR_AMOUNT_MESSAGE });
      return z.NEVER;
    }
    return { plan, donorAmount };
  });
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

export const captureOrderBodySchema = z.object({
  orderId: z.string({ required_error: INVALID_ORDER_ID_MESSAGE }).trim().min(1, INVALID_ORDER_ID_MESSAGE),
});
export type CaptureOrderBody = z.infer<typeof captureOrderBodySchema>;
