import type { Favorite, Prisma, PrismaClient, Subscription } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type FavoriteWithDinosaur = Prisma.FavoriteGetPayload<{
  include: { dinosaur: true };
}>;

/**
 * Prisma access for favorites. Only repositories touch Prisma.
 */
export class FavoritesRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) throw new ServiceUnavailableError("Database unavailable");
    return prisma;
  }

  async findManyByUserId(userId: string): Promise<FavoriteWithDinosaur[]> {
    return this.requirePrisma().favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
    });
  }

  async findByUserAndDino(userId: string, dinoId: number): Promise<Favorite | null> {
    return this.requirePrisma().favorite.findFirst({
      where: { userId, dinoId },
    });
  }

  async findSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return this.requirePrisma().subscription.findUnique({
      where: { userId },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.requirePrisma().favorite.count({
      where: { userId },
    });
  }

  async create(userId: string, dinoId: number): Promise<Favorite> {
    return this.requirePrisma().favorite.create({
      data: { userId, dinoId },
    });
  }

  async deleteByUserAndDino(userId: string, dinoId: number): Promise<void> {
    await this.requirePrisma().favorite.deleteMany({
      where: { userId, dinoId },
    });
  }
}
