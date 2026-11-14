import type { PaypalPlan } from "./Paypal.schemas";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ResolvedPlan {
  /** Price as a two-decimal string (never floating point math on money). */
  amount: string;
  description: string;
  /** The subscription plan stored for the user. */
  subscriptionPlan: "premium" | "donor";
  durationDays: number;
}

/**
 * Single source of truth for what each purchasable plan costs and grants.
 * Donations are priced by the donor (validated before this is called).
 */
export function resolvePlan(plan: PaypalPlan, donorAmount?: number): ResolvedPlan {
  switch (plan) {
    case "premium_monthly":
      return { amount: "3.00", description: "DinoProject Premium - Monthly", subscriptionPlan: "premium", durationDays: 30 };
    case "premium_yearly":
      return { amount: "24.00", description: "DinoProject Premium - Yearly", subscriptionPlan: "premium", durationDays: 365 };
    case "donor":
      return {
        amount: (donorAmount ?? 5).toFixed(2),
        description: "DinoProject Donor Support",
        subscriptionPlan: "donor",
        durationDays: 180,
      };
  }
}

export function isPaypalPlan(value: string): value is PaypalPlan {
  return value === "premium_monthly" || value === "premium_yearly" || value === "donor";
}

export function expiryFrom(now: number, durationDays: number): Date {
  return new Date(now + durationDays * MS_PER_DAY);
}
