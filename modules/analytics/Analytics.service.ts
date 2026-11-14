import type { AnalyticsRepository } from "./Analytics.repository";

export type AnalyticsPayload = {
  overview: {
    totalUsers: number;
    totalDinosaurs: number;
    totalQuizzes: number;
    premiumSubscribers: number;
    freeUsers: number;
    usersLast7Days: number;
    usersLast30Days: number;
    quizCompletions: number;
  };
  charts: {
    dailyRegistrations: { date: string; count: number }[];
    subscriptionBreakdown: { plan: string; count: number }[];
  };
  recentActivity: {
    user: string | null;
    quiz: string;
    score: number;
    date: Date;
  }[];
};

/**
 * Analytics domain logic (date aggregation). No Express types here.
 */
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getAnalytics(): Promise<AnalyticsPayload> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const overviewData = await this.repository.getOverviewCounts(
      sevenDaysAgo,
      thirtyDaysAgo,
    );
    const usersByDay =
      await this.repository.groupUsersByCreatedAtSince(thirtyDaysAgo);

    const {
      totalUsers,
      totalDinosaurs,
      totalQuizzes,
      premiumSubscribers,
      usersLast7Days,
      usersLast30Days,
      quizCompletions,
      recentScores,
    } = overviewData;

    const dailyRegistrations: { [key: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyRegistrations[dateStr] = 0;
    }
    usersByDay.forEach((entry) => {
      const dateStr = new Date(entry.createdAt).toISOString().split("T")[0];
      if (dailyRegistrations[dateStr] !== undefined) {
        dailyRegistrations[dateStr]++;
      }
    });

    const freeUsers = totalUsers - premiumSubscribers;

    return {
      overview: {
        totalUsers,
        totalDinosaurs,
        totalQuizzes,
        premiumSubscribers,
        freeUsers,
        usersLast7Days,
        usersLast30Days,
        quizCompletions,
      },
      charts: {
        dailyRegistrations: Object.entries(dailyRegistrations).map(
          ([date, count]) => ({
            date,
            count,
          }),
        ),
        subscriptionBreakdown: [
          { plan: "Free", count: freeUsers },
          { plan: "Premium", count: premiumSubscribers },
        ],
      },
      recentActivity: recentScores.slice(0, 10).map((s) => ({
        user: s.user.name,
        quiz: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    };
  }
}
