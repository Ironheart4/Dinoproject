import type { PrismaClient, Question, Quiz, Score } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";
import type { QuestionInput } from "./Quizzes.schemas";

export type QuizWithQuestions = Quiz & { questions: Question[] };
export type QuizSummary = { id: number; title: string };
export type ScoreWithQuizSummary = Score & { quiz: QuizSummary };
export type QuizPresentation = {
  title: string;
  questionType: string | null;
  imageUrl: string | null;
  difficulty: string | null;
};
export type QuestionWithQuiz = Question & { quiz: QuizPresentation };

/** Quiz fields that can be written (all optional except on create, where title is required). */
export interface QuizWriteData {
  title?: string;
  questionType?: string | null;
  imageUrl?: string | null;
  difficulty?: string | null;
  questions?: QuestionInput[];
}

/** Prisma error code for "record to update or delete does not exist". */
const RECORD_NOT_FOUND = "P2025";

function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === RECORD_NOT_FOUND
  );
}

/**
 * Prisma access for quizzes and questions. Only repositories touch Prisma.
 */
export class QuizzesRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findAllWithQuestions(): Promise<QuizWithQuestions[]> {
    return this.requirePrisma().quiz.findMany({ include: { questions: true } });
  }

  findByIdWithQuestions(id: number): Promise<QuizWithQuestions | null> {
    return this.requirePrisma().quiz.findUnique({
      where: { id },
      include: { questions: true },
    });
  }

  createWithQuestions(data: QuizWriteData & { title: string }): Promise<QuizWithQuestions> {
    return this.requirePrisma().quiz.create({
      data: {
        title: data.title,
        questionType: data.questionType ?? null,
        imageUrl: data.imageUrl ?? null,
        difficulty: data.difficulty ?? null,
        questions: { create: data.questions ?? [] },
      },
      include: { questions: true },
    });
  }

  /**
   * Updates the given fields and, when `questions` is given, replaces all questions.
   * Runs in one transaction so a failed update never leaves a quiz without questions.
   * Returns null when the quiz does not exist.
   */
  async update(id: number, data: QuizWriteData): Promise<QuizWithQuestions | null> {
    const prisma = this.requirePrisma();
    try {
      return await prisma.$transaction(async (tx) => {
        if (data.questions) {
          await tx.question.deleteMany({ where: { quizId: id } });
        }
        return tx.quiz.update({
          where: { id },
          data: {
            title: data.title,
            questionType: data.questionType,
            imageUrl: data.imageUrl,
            difficulty: data.difficulty,
            ...(data.questions ? { questions: { create: data.questions } } : {}),
          },
          include: { questions: true },
        });
      });
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  /**
   * Deletes a quiz together with its scores and questions in one transaction (the
   * database foreign keys have no ON DELETE CASCADE). Returns false when the quiz does not exist.
   */
  async delete(id: number): Promise<boolean> {
    const prisma = this.requirePrisma();
    try {
      await prisma.$transaction(async (tx) => {
        await tx.score.deleteMany({ where: { quizId: id } });
        await tx.question.deleteMany({ where: { quizId: id } });
        await tx.quiz.delete({ where: { id } });
      });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }

  findScoresWithQuizSummary(userId: string): Promise<ScoreWithQuizSummary[]> {
    return this.requirePrisma().score.findMany({
      where: { userId },
      include: { quiz: { select: { id: true, title: true } } },
      orderBy: { completedAt: "desc" },
    });
  }

  findAllSummaries(): Promise<QuizSummary[]> {
    return this.requirePrisma().quiz.findMany({ select: { id: true, title: true } });
  }

  findFirstSummaryNotIn(excludedIds: number[]): Promise<QuizSummary | null> {
    return this.requirePrisma().quiz.findFirst({
      where: { id: { notIn: excludedIds } },
      select: { id: true, title: true },
    });
  }

  findSummaryById(id: number): Promise<QuizSummary | null> {
    return this.requirePrisma().quiz.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
  }

  findAllQuestionsWithQuiz(): Promise<QuestionWithQuiz[]> {
    return this.requirePrisma().question.findMany({
      include: {
        quiz: { select: { title: true, questionType: true, imageUrl: true, difficulty: true } },
      },
    });
  }
}
