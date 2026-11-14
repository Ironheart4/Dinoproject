import type { Dinosaur, PrismaClient, Subscription } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

/**
 * Prisma access for the AI assistant (entitlement check and dinosaur lookup). Only repositories touch Prisma.
 */
export class AiRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findSubscription(userId: string): Promise<Subscription | null> {
    return this.requirePrisma().subscription.findUnique({ where: { userId } });
  }

  findDinosaurs(limit: number): Promise<Dinosaur[]> {
    return this.requirePrisma().dinosaur.findMany({ take: limit });
  }
}
