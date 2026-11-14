import { describe, expect, it, vi } from "vitest";
import type { DashboardRepository } from "../../modules/dashboard/Dashboard.repository";
import { DashboardService, summarizeScores } from "../../modules/dashboard/Dashboard.service";

function mockRepository(overrides: Partial<DashboardRepository> = {}): DashboardRepository {
  return {
    findUserWithSubscription: vi.fn().mockResolvedValue(null),
    countFavorites: vi.fn().mockResolvedValue(0),
    findScoresWithQuiz: vi.fn().mockResolvedValue([]),
    findFavoritesWithDinosaur: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as DashboardRepository;
}

describe("summarizeScores", () => {
  it("returns zeros for no attempts", () => {
    expect(summarizeScores([])).toEqual({ quizzesCompleted: 0, highestScore: 0, averageScore: 0 });
  });

  it("computes the highest and a rounded average", () => {
    expect(summarizeScores([{ score: 80 }, { score: 90 }, { score: 71 }])).toEqual({
      quizzesCompleted: 3,
      highestScore: 90,
      averageScore: 80,
    });
  });
});

describe("DashboardService.getStats", () => {
  it("defaults to a free subscription and computes the activity streak in days", async () => {
    const now = new Date("2026-01-11T00:00:00Z");
    const service = new DashboardService(
      mockRepository({
        findUserWithSubscription: vi.fn().mockResolvedValue({
          id: "u1",
          name: "Ayo",
          bio: null,
          profilePic: null,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          subscription: null,
        }),
        countFavorites: vi.fn().mockResolvedValue(3),
      }),
    );
    const result = await service.getStats("u1", "a@b.c", now);
    expect(result.subscription).toEqual({ plan: "free", status: "active" });
    expect(result.stats).toMatchObject({ favoritesCount: 3, activityStreak: 10, quizzesCompleted: 0 });
    expect(result.user.email).toBe("a@b.c");
  });
});

describe("DashboardService.getCharts", () => {
  it("groups favorites by type and diet and lists quiz progress", async () => {
    const fav = (type: string | null, diet: string | null) => ({ dinosaur: { type, diet } });
    const service = new DashboardService(
      mockRepository({
        findFavoritesWithDinosaur: vi
          .fn()
          .mockResolvedValue([fav("theropod", "Carnivorous"), fav("theropod", "Carnivorous"), fav(null, null)]),
        findScoresWithQuiz: vi.fn().mockResolvedValue([
          { score: 70, completedAt: new Date("2026-02-03T10:00:00Z"), quiz: { title: "Diet" } },
        ]),
      }),
    );
    const result = await service.getCharts("u1");
    expect(result.topTypes).toEqual([
      { type: "theropod", count: 2 },
      { type: "Unknown", count: 1 },
    ]);
    expect(result.diets).toEqual([
      { diet: "Carnivorous", count: 2 },
      { diet: "Unknown", count: 1 },
    ]);
    expect(result.quizProgress).toEqual([{ date: "2026-02-03", score: 70, quizTitle: "Diet" }]);
  });

  it("limits top types to five", async () => {
    const favorites = ["a", "b", "c", "d", "e", "f"].map((type) => ({ dinosaur: { type, diet: "x" } }));
    const service = new DashboardService(
      mockRepository({ findFavoritesWithDinosaur: vi.fn().mockResolvedValue(favorites) }),
    );
    expect((await service.getCharts("u1")).topTypes).toHaveLength(5);
  });
});

describe("DashboardService.getActivity", () => {
  it("falls back to the species when a dinosaur has no common name", async () => {
    const service = new DashboardService(
      mockRepository({
        findFavoritesWithDinosaur: vi.fn().mockResolvedValue([
          { id: 1, dinoId: 9, createdAt: new Date("2026-01-01"), dinosaur: { name: null, species: "T. rex" } },
        ]),
        findScoresWithQuiz: vi.fn().mockResolvedValue([
          { id: 2, quizId: 4, score: 90, completedAt: new Date("2026-01-02"), quiz: { title: "Eras" } },
        ]),
      }),
    );
    const result = await service.getActivity("u1");
    expect(result.favorites[0]).toMatchObject({ dinosaurId: 9, dinosaurName: "T. rex" });
    expect(result.quizzes[0]).toMatchObject({ quizId: 4, quizTitle: "Eras", score: 90 });
  });
});
