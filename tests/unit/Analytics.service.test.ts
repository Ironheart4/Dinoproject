import { describe, expect, it, vi } from "vitest";
import type { AnalyticsRepository } from "../../modules/analytics/Analytics.repository";
import { AnalyticsService } from "../../modules/analytics/Analytics.service";

function mockRepository(
  overrides: Partial<AnalyticsRepository> = {},
): AnalyticsRepository {
  return {
    getOverviewCounts: vi.fn().mockResolvedValue({
      totalUsers: 10,
      totalDinosaurs: 5,
      totalQuizzes: 3,
      premiumSubscribers: 2,
      usersLast7Days: 1,
      usersLast30Days: 4,
      quizCompletions: 20,
      recentScores: [
        {
          score: 80,
          completedAt: new Date("2024-06-01"),
          user: { name: "Ada" },
          quiz: { title: "Diet Quiz" },
        },
      ],
    }),
    groupUsersByCreatedAtSince: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as AnalyticsRepository;
}

describe("AnalyticsService", () => {
  it("builds overview with freeUsers and subscription breakdown", async () => {
    const service = new AnalyticsService(mockRepository());
    const result = await service.getAnalytics();

    expect(result.overview).toEqual({
      totalUsers: 10,
      totalDinosaurs: 5,
      totalQuizzes: 3,
      premiumSubscribers: 2,
      freeUsers: 8,
      usersLast7Days: 1,
      usersLast30Days: 4,
      quizCompletions: 20,
    });
    expect(result.charts.subscriptionBreakdown).toEqual([
      { plan: "Free", count: 8 },
      { plan: "Premium", count: 2 },
    ]);
  });

  it("fills 30 daily registration slots and increments matching days", async () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const service = new AnalyticsService(
      mockRepository({
        groupUsersByCreatedAtSince: vi.fn().mockResolvedValue([
          { createdAt: now, _count: { id: 1 } },
          { createdAt: now, _count: { id: 1 } },
        ]),
      }),
    );

    const result = await service.getAnalytics();
    expect(result.charts.dailyRegistrations).toHaveLength(30);
    const today = result.charts.dailyRegistrations.find((d) => d.date === todayStr);
    expect(today?.count).toBe(2);
  });

  it("maps recentActivity from the first 10 recent scores", async () => {
    const recentScores = Array.from({ length: 12 }, (_, i) => ({
      score: i,
      completedAt: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
      user: { name: `User${i}` },
      quiz: { title: `Quiz${i}` },
    }));
    const service = new AnalyticsService(
      mockRepository({
        getOverviewCounts: vi.fn().mockResolvedValue({
          totalUsers: 0,
          totalDinosaurs: 0,
          totalQuizzes: 0,
          premiumSubscribers: 0,
          usersLast7Days: 0,
          usersLast30Days: 0,
          quizCompletions: 0,
          recentScores,
        }),
      }),
    );

    const result = await service.getAnalytics();
    expect(result.recentActivity).toHaveLength(10);
    expect(result.recentActivity[0]).toEqual({
      user: "User0",
      quiz: "Quiz0",
      score: 0,
      date: recentScores[0].completedAt,
    });
  });
});
