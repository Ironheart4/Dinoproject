import type { PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type RecentScoreRow = {
  score: number;
  completedAt: Date;
  user: { name: string | null };
  quiz: { title: string };
};

export type UserCreatedAtGroup = {
  createdAt: Date;
  _count: { id: number };
};

export type AnalyticsOverviewCounts = {
  totalUsers: number;
  totalDinosaurs: number;
  totalQuizzes: number;
  premiumSubscribers: number;
  usersLast7Days: number;
  usersLast30Days: number;
  quizCompletions: number;
};

/**
 * Prisma access for admin analytics. Only repositories touch Prisma.
 */
export class AnalyticsRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  async getOverviewCounts(
    sevenDaysAgo: Date,
    thirtyDaysAgo: Date,
  ): Promise<AnalyticsOverviewCounts & { recentScores: RecentScoreRow[] }> {
    const prisma = this.requirePrisma();
    const [
      totalUsers,
      totalDinosaurs,
      totalQuizzes,
      premiumSubscribers,
      usersLast7Days,
      usersLast30Days,
      quizCompletions,
      recentScores,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.dinosaur.count(),
      prisma.quiz.count(),
      prisma.subscription.count({
        where: { plan: "premium", status: "active" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.score.count(),
      prisma.score.findMany({
        take: 100,
        orderBy: { completedAt: "desc" },
        include: {
          user: { select: { name: true } },
          quiz: { select: { title: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalDinosaurs,
      totalQuizzes,
      premiumSubscribers,
      usersLast7Days,
      usersLast30Days,
      quizCompletions,
      recentScores,
    };
  }

  async groupUsersByCreatedAtSince(
    thirtyDaysAgo: Date,
  ): Promise<UserCreatedAtGroup[]> {
    // Avoid annotating groupBy's return on the call itself — Prisma overloads
    // intersect the expected return type into the args and break inference.
    const rows = await this.requirePrisma().user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    return rows;
  }
}
