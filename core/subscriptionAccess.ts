/** Minimal subscription shape needed to decide access (matches the Prisma model). */
export interface SubscriptionAccessInput {
  status: string;
  plan: string;
  endDate: Date | null;
}

/**
 * Single rule for "does this subscription currently grant paid features?"
 * - The subscription must be active and the plan `premium` or `donor`.
 * - `premium` without an end date does not expire; with an end date it must not be in the past.
 * - `donor` always needs an end date that is not in the past.
 */
export function hasActivePaidAccess(
  subscription: SubscriptionAccessInput | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription || subscription.status !== "active") return false;

  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;

  if (subscription.plan === "premium") {
    return endDate === null || now <= endDate;
  }
  if (subscription.plan === "donor") {
    return endDate !== null && now <= endDate;
  }
  return false;
}
