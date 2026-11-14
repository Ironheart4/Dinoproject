import type { Dinosaur, Favorite, PrismaClient, Quiz, Score, Subscription, User } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type UserWithSubscription = User & { subscription: Subscription | null };
export type ScoreWithQuiz = Score & { quiz: Quiz };
export type FavoriteWithDinosaur = Favorite & { dinosaur: Dinosaur };

/**
 * Prisma access for the personal dashboard. Only repositories touch Prisma.
 */
export class DashboardRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
    return this.requirePrisma().user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }

  countFavorites(userId: string): Promise<number> {
    return this.requirePrisma().favorite.count({ where: { userId } });
  }

  findScoresWithQuiz(userId: string, order: "asc" | "desc" | "none"): Promise<ScoreWithQuiz[]> {
    return this.requirePrisma().score.findMany({
      where: { userId },
      include: { quiz: true },
      ...(order === "none" ? {} : { orderBy: { completedAt: order } }),
    });
  }

  findFavoritesWithDinosaur(userId: string, order: "desc" | "none"): Promise<FavoriteWithDinosaur[]> {
    return this.requirePrisma().favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
      ...(order === "none" ? {} : { orderBy: { createdAt: order } }),
    });
  }
}
