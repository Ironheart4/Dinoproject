import type { PayPalOrder, PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

/** Order lifecycle: created, then processing while being captured, then captured. */
export const ORDER_CREATED = "created";
export const ORDER_PROCESSING = "processing";
export const ORDER_CAPTURED = "captured";

/**
 * Prisma access for PayPal orders and the subscriptions they grant. Only repositories touch Prisma.
 */
export class PaypalRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  createOrder(data: { id: string; userId: string; plan: string; amount: string }): Promise<PayPalOrder> {
    return this.requirePrisma().payPalOrder.create({ data });
  }

  /**
   * Atomically moves the user's order from "created" to "processing" so two requests can never
   * capture (and credit) the same order. Returns null if it does not exist or was already taken.
   */
  async claimOrder(orderId: string, userId: string): Promise<PayPalOrder | null> {
    const prisma = this.requirePrisma();
    const claimed = await prisma.payPalOrder.updateMany({
      where: { id: orderId, userId, status: ORDER_CREATED },
      data: { status: ORDER_PROCESSING },
    });
    if (claimed.count === 0) return null;
    return prisma.payPalOrder.findUnique({ where: { id: orderId } });
  }

  /** Puts an order back to "created" (used when verification or capture failed, so the user can retry). */
  async releaseOrder(orderId: string): Promise<void> {
    await this.requirePrisma().payPalOrder.updateMany({
      where: { id: orderId, status: ORDER_PROCESSING },
      data: { status: ORDER_CREATED },
    });
  }

  /** Marks the order captured and creates or extends the user's subscription in one transaction. */
  async completeOrder(data: {
    orderId: string;
    userId: string;
    plan: string;
    endDate: Date;
  }): Promise<void> {
    const prisma = this.requirePrisma();
    await prisma.$transaction(async (tx) => {
      await tx.payPalOrder.update({ where: { id: data.orderId }, data: { status: ORDER_CAPTURED } });
      await tx.subscription.upsert({
        where: { userId: data.userId },
        update: { plan: data.plan, status: "active", endDate: data.endDate, paypalOrderId: data.orderId },
        create: {
          userId: data.userId,
          plan: data.plan,
          status: "active",
          endDate: data.endDate,
          paypalOrderId: data.orderId,
        },
      });
    });
  }
}
