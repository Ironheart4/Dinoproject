import { describe, expect, it, vi } from "vitest";
import type { Score } from "@prisma/client";
import type { ScoresRepository } from "../../modules/scores/Scores.repository";
import { ScoresService } from "../../modules/scores/Scores.service";

function mockRepository(
  overrides: Partial<ScoresRepository> = {},
): ScoresRepository {
  return {
    findManyForUserWithQuizTitle: vi.fn().mockResolvedValue([]),
    findManyForUserWithQuiz: vi.fn().mockResolvedValue([]),
    createScore: vi.fn(),
    ...overrides,
  } as ScoresRepository;
}

describe("ScoresService", () => {
  it("getMyScores delegates to findManyForUserWithQuizTitle", async () => {
    const rows = [
      {
        id: 1,
        userId: "u1",
        quizId: 2,
        score: 90,
        completedAt: new Date("2024-01-01"),
        quiz: { title: "Diet Quiz" },
      },
    ];
    const findManyForUserWithQuizTitle = vi.fn().mockResolvedValue(rows);
    const service = new ScoresService(
      mockRepository({ findManyForUserWithQuizTitle }),
    );

    await expect(service.getMyScores("u1")).resolves.toEqual(rows);
    expect(findManyForUserWithQuizTitle).toHaveBeenCalledWith("u1");
  });

  it("listScores delegates to findManyForUserWithQuiz", async () => {
    const rows = [
      {
        id: 1,
        userId: "u1",
        quizId: 2,
        score: 80,
        completedAt: new Date("2024-01-02"),
        quiz: { id: 2, title: "Diet Quiz", createdAt: new Date("2023-01-01") },
      },
    ];
    const findManyForUserWithQuiz = vi.fn().mockResolvedValue(rows);
    const service = new ScoresService(
      mockRepository({ findManyForUserWithQuiz }),
    );

    await expect(service.listScores("u1")).resolves.toEqual(rows);
    expect(findManyForUserWithQuiz).toHaveBeenCalledWith("u1");
  });

  it("createScore delegates userId, quizId, and score", async () => {
    const created = {
      id: 5,
      userId: "u1",
      quizId: 3,
      score: 75,
      completedAt: new Date("2024-06-01"),
    } as Score;
    const createScore = vi.fn().mockResolvedValue(created);
    const service = new ScoresService(mockRepository({ createScore }));

    await expect(
      service.createScore({ userId: "u1", quizId: 3, score: 75 }),
    ).resolves.toEqual(created);
    expect(createScore).toHaveBeenCalledWith({
      userId: "u1",
      quizId: 3,
      score: 75,
    });
  });
});
