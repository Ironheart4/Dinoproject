import type { SubscriptionRepository } from "./Subscription.repository";

export type SubscriptionPayload =
  | { plan: "free"; status: "active" }
  | {
      id: number;
      userId: string;
      plan: string;
      status: string;
      startDate: Date;
      endDate: Date | null;
      paypalSubscriptionId: string | null;
      paypalOrderId: string | null;
      createdAt: Date;
      donorExpired?: true;
    };

/**
 * Subscription domain logic. No Express types here.
 */
export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async getForUser(userId: string): Promise<SubscriptionPayload> {
    const subscription = await this.repository.findByUserId(userId);

    if (!subscription) {
      return { plan: "free", status: "active" };
    }

    if (subscription.plan === "donor" && subscription.endDate) {
      const now = new Date();
      if (now > new Date(subscription.endDate)) {
        if (subscription.status !== "expired") {
          await this.repository.updateStatus(userId, "expired");
        }
        return { ...subscription, status: "expired", donorExpired: true };
      }
    }

    return subscription;
  }

  async upsertForUser(
    userId: string,
    plan: string,
    paypalSubscriptionId?: string,
  ) {
    const endDate = new Date();
    if (plan === "premium") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === "donor") {
      endDate.setMonth(endDate.getMonth() + 6);
    }

    return this.repository.upsertActive({
      userId,
      plan,
      endDate,
      paypalSubscriptionId,
    });
  }

  async cancelForUser(userId: string): Promise<{ success: true }> {
    await this.repository.updateStatus(userId, "cancelled");
    return { success: true };
  }
}
