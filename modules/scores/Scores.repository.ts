import type { PrismaClient, Quiz, Score } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type ScoreWithQuizTitle = Score & {
  quiz: { title: string };
};

export type ScoreWithQuiz = Score & {
  quiz: Quiz;
};

/**
 * Prisma access for quiz scores. Only repositories touch Prisma.
 */
export class ScoresRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  async findManyForUserWithQuizTitle(userId: string): Promise<ScoreWithQuizTitle[]> {
    return this.requirePrisma().score.findMany({
      where: { userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
    });
  }

  async findManyForUserWithQuiz(userId: string): Promise<ScoreWithQuiz[]> {
    return this.requirePrisma().score.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    });
  }

  async createScore(data: {
    userId: string;
    quizId: number;
    score: number;
  }): Promise<Score> {
    return this.requirePrisma().score.create({ data });
  }
}
