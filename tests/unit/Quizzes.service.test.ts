import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../core/errors";
import type { QuizzesRepository } from "../../modules/quizzes/Quizzes.repository";
import { QuizzesService, shuffle, toQuizView } from "../../modules/quizzes/Quizzes.service";

function mockRepository(overrides: Partial<QuizzesRepository> = {}): QuizzesRepository {
  return {
    findAllWithQuestions: vi.fn().mockResolvedValue([]),
    findByIdWithQuestions: vi.fn().mockResolvedValue(null),
    createWithQuestions: vi.fn(),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(false),
    findScoresWithQuizSummary: vi.fn().mockResolvedValue([]),
    findAllSummaries: vi.fn().mockResolvedValue([]),
    findFirstSummaryNotIn: vi.fn().mockResolvedValue(null),
    findSummaryById: vi.fn().mockResolvedValue(null),
    findAllQuestionsWithQuiz: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as QuizzesRepository;
}

const quizA = { id: 1, title: "Diet" };
const quizB = { id: 2, title: "Eras" };
const scoreRow = (score: number, quiz = quizA) => ({ id: 1, userId: "u", quizId: quiz.id, score, quiz });

describe("shuffle", () => {
  it("returns the same items without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, () => 0.3);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("QuizzesService CRUD", () => {
  it("get throws NotFoundError for a missing quiz", async () => {
    await expect(new QuizzesService(mockRepository()).get(9)).rejects.toThrow(NotFoundError);
  });

  it("create passes the quiz fields to the repository and returns the view", async () => {
    const createWithQuestions = vi.fn().mockResolvedValue({ id: 1, title: "T", questions: [] });
    const result = await new QuizzesService(mockRepository({ createWithQuestions })).create({
      title: "T",
      questionType: "image",
      difficulty: "hard",
    });
    expect(createWithQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ title: "T", questionType: "image", difficulty: "hard" }),
    );
    expect(result.questions).toEqual([]);
  });

  it("update and remove throw NotFoundError when the quiz is missing", async () => {
    const service = new QuizzesService(mockRepository());
    await expect(service.update(1, { title: "x" })).rejects.toThrow(NotFoundError);
    await expect(service.remove(1)).rejects.toThrow(NotFoundError);
  });

  it("remove returns success when deleted", async () => {
    const service = new QuizzesService(mockRepository({ delete: vi.fn().mockResolvedValue(true) }));
    await expect(service.remove(1)).resolves.toEqual({ success: true });
  });
});

describe("toQuizView", () => {
  const baseQuiz = { id: 1, title: "T", createdAt: new Date(), questions: [{ id: 7, quizId: 1 }] };

  it("copies quiz-level fields onto each question", () => {
    const view = toQuizView({
      ...baseQuiz,
      questionType: "identify",
      imageUrl: "https://img/x.png",
      difficulty: "hard",
    } as never);
    expect(view.questions[0]).toMatchObject({
      id: 7,
      questionType: "identify",
      imageUrl: "https://img/x.png",
      difficulty: "hard",
    });
  });

  it("applies defaults when the quiz has no presentation fields", () => {
    const view = toQuizView({ ...baseQuiz, questionType: null, imageUrl: null, difficulty: null } as never);
    expect(view.questions[0]).toMatchObject({ questionType: "text", imageUrl: null, difficulty: "medium" });
  });
});

describe("QuizzesService.randomQuestions", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    quiz: { title: "Q", questionType: "image", imageUrl: "u", difficulty: "easy" },
  }));

  it("returns at most count questions", async () => {
    const service = new QuizzesService(
      mockRepository({ findAllQuestionsWithQuiz: vi.fn().mockResolvedValue(rows) }),
    );
    expect(await service.randomQuestions(3)).toHaveLength(3);
    expect(await service.randomQuestions(50)).toHaveLength(5);
  });

  it("adds the quiz presentation fields and keeps the quiz title", async () => {
    const service = new QuizzesService(
      mockRepository({ findAllQuestionsWithQuiz: vi.fn().mockResolvedValue(rows) }),
    );
    const [first] = await service.randomQuestions(1);
    expect(first).toMatchObject({ questionType: "image", imageUrl: "u", difficulty: "easy", quiz: { title: "Q" } });
  });
});

describe("QuizzesService.recommendFor", () => {
  it("throws NotFoundError when there are no scores and no quizzes", async () => {
    await expect(new QuizzesService(mockRepository()).recommendFor("u")).rejects.toThrow(
      "No quizzes available",
    );
  });

  it("suggests a random quiz to a new user", async () => {
    const service = new QuizzesService(
      mockRepository({ findAllSummaries: vi.fn().mockResolvedValue([quizA, quizB]) }),
      () => 0.99,
    );
    await expect(service.recommendFor("u")).resolves.toEqual({
      recommendedQuiz: quizB,
      reason: "Try this quiz to get started!",
    });
  });

  it("recommends retaking the lowest-scoring quiz", async () => {
    const findSummaryById = vi.fn().mockResolvedValue(quizB);
    const service = new QuizzesService(
      mockRepository({
        findScoresWithQuizSummary: vi.fn().mockResolvedValue([scoreRow(80, quizA), scoreRow(40, quizB)]),
        findSummaryById,
      }),
    );
    const result = await service.recommendFor("u");
    expect(findSummaryById).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      recommendedQuiz: quizB,
      reason: 'Improve your score on "Eras" (current: 40%)',
      currentScore: 40,
    });
  });

  it("recommends an untaken quiz when every score is 100", async () => {
    const findFirstSummaryNotIn = vi.fn().mockResolvedValue(quizB);
    const service = new QuizzesService(
      mockRepository({
        findScoresWithQuizSummary: vi.fn().mockResolvedValue([scoreRow(100, quizA)]),
        findFirstSummaryNotIn,
      }),
    );
    const result = await service.recommendFor("u");
    expect(findFirstSummaryNotIn).toHaveBeenCalledWith([1]);
    expect(result.recommendedQuiz).toEqual(quizB);
    expect(result.reason).toBe("You've mastered the others, try this new challenge!");
  });

  it("keeps the legacy quirk when all scores are 100 and nothing is untaken", async () => {
    const service = new QuizzesService(
      mockRepository({ findScoresWithQuizSummary: vi.fn().mockResolvedValue([scoreRow(100, quizA)]) }),
    );
    const result = await service.recommendFor("u");
    expect(result.recommendedQuiz).toBeNull();
    expect(result.currentScore).toBe(100);
  });
});
