import type { Score } from "@prisma/client";
import type {
  ScoresRepository,
  ScoreWithQuiz,
  ScoreWithQuizTitle,
} from "./Scores.repository";

/**
 * Scores domain logic. No Express types here.
 */
export class ScoresService {
  constructor(private readonly repository: ScoresRepository) {}

  getMyScores(userId: string): Promise<ScoreWithQuizTitle[]> {
    return this.repository.findManyForUserWithQuizTitle(userId);
  }

  listScores(userId: string): Promise<ScoreWithQuiz[]> {
    return this.repository.findManyForUserWithQuiz(userId);
  }

  createScore(input: {
    userId: string;
    quizId: number;
    score: number;
  }): Promise<Score> {
    return this.repository.createScore(input);
  }
}
