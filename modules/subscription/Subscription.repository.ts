import type { PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type SubscriptionRow = {
  id: number;
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  paypalSubscriptionId: string | null;
  paypalOrderId: string | null;
  createdAt: Date;
};

export type UpsertSubscriptionInput = {
  userId: string;
  plan: string;
  endDate: Date;
  paypalSubscriptionId?: string;
};

/**
 * Prisma access for subscriptions. Only repositories touch Prisma.
 */
export class SubscriptionRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  async findByUserId(userId: string): Promise<SubscriptionRow | null> {
    return this.requirePrisma().subscription.findUnique({
      where: { userId },
    });
  }

  async updateStatus(userId: string, status: string): Promise<SubscriptionRow> {
    return this.requirePrisma().subscription.update({
      where: { userId },
      data: { status },
    });
  }

  async upsertActive(input: UpsertSubscriptionInput): Promise<SubscriptionRow> {
    const { userId, plan, endDate, paypalSubscriptionId } = input;
    return this.requirePrisma().subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: "active",
        startDate: new Date(),
        endDate,
        paypalSubscriptionId,
      },
      create: {
        userId,
        plan,
        status: "active",
        endDate,
        paypalSubscriptionId,
      },
    });
  }
}
