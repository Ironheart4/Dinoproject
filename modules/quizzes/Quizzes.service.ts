import { NotFoundError } from "../../core/errors";
import type { Question } from "@prisma/client";
import type {
  QuestionWithQuiz,
  QuizSummary,
  QuizWithQuestions,
  QuizzesRepository,
} from "./Quizzes.repository";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_QUESTION_TYPE,
  type CreateQuizBody,
  type UpdateQuizBody,
} from "./Quizzes.schemas";

export interface QuizRecommendation {
  recommendedQuiz: QuizSummary | null;
  reason: string;
  currentScore?: number;
}

const NOT_FOUND_MESSAGE = "Quiz not found";

/** A question as the API returns it: quiz-level presentation fields copied onto the question. */
export type QuestionView = Question & {
  questionType: string;
  imageUrl: string | null;
  difficulty: string;
};
export type QuizView = Omit<QuizWithQuestions, "questions"> & { questions: QuestionView[] };
export type RandomQuestionView = QuestionView & { quiz: { title: string } };

interface Presentation {
  questionType: string | null;
  imageUrl: string | null;
  difficulty: string | null;
}

function presentationOf(source: Presentation) {
  return {
    questionType: source.questionType ?? DEFAULT_QUESTION_TYPE,
    imageUrl: source.imageUrl ?? null,
    difficulty: source.difficulty ?? DEFAULT_DIFFICULTY,
  };
}

/** Copies the quiz-level type, image and difficulty onto each question (the quiz page reads them per question). */
export function toQuizView(quiz: QuizWithQuestions): QuizView {
  const presentation = presentationOf(quiz);
  return {
    ...quiz,
    questions: quiz.questions.map((question) => ({ ...question, ...presentation })),
  };
}

/** Returns a new array in random order (Fisher-Yates); `random` is injectable for tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Quiz domain logic (CRUD, random questions, recommendations). No Express types here.
 */
export class QuizzesService {
  constructor(
    private readonly repository: QuizzesRepository,
    private readonly random: () => number = Math.random,
  ) {}

  async list(): Promise<QuizView[]> {
    return (await this.repository.findAllWithQuestions()).map(toQuizView);
  }

  async get(id: number): Promise<QuizView> {
    const quiz = await this.repository.findByIdWithQuestions(id);
    if (!quiz) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return toQuizView(quiz);
  }

  async create(input: CreateQuizBody): Promise<QuizView> {
    return toQuizView(await this.repository.createWithQuestions(input));
  }

  async update(id: number, input: UpdateQuizBody): Promise<QuizView> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return toQuizView(updated);
  }

  async remove(id: number): Promise<{ success: true }> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return { success: true };
  }

  /** Random sample of questions across all quizzes, each carrying its quiz's type, image and difficulty. */
  async randomQuestions(count: number): Promise<RandomQuestionView[]> {
    const questions = await this.repository.findAllQuestionsWithQuiz();
    const selected = shuffle(questions, this.random).slice(0, Math.min(count, questions.length));
    return selected.map((question: QuestionWithQuiz) => ({
      ...question,
      ...presentationOf(question.quiz),
      quiz: { title: question.quiz.title },
    }));
  }

  /**
   * Recommends a quiz from the user's weak areas:
   * 1. No scores yet: a random quiz.
   * 2. Otherwise the lowest-scoring quiz to retake (most recent wins ties).
   * 3. If every score is 100: a quiz the user has not taken, when one exists.
   *
   * Known legacy quirk, kept on purpose: with all scores at 100 and no untaken quiz,
   * `recommendedQuiz` is null and the reason text is empty-titled.
   */
  async recommendFor(userId: string): Promise<QuizRecommendation> {
    const userScores = await this.repository.findScoresWithQuizSummary(userId);

    if (userScores.length === 0) {
      const allQuizzes = await this.repository.findAllSummaries();
      if (allQuizzes.length === 0) throw new NotFoundError("No quizzes available");
      return {
        recommendedQuiz: allQuizzes[Math.floor(this.random() * allQuizzes.length)],
        reason: "Try this quiz to get started!",
      };
    }

    let lowest = { score: 100, quizId: -1, quizTitle: "" };
    for (const entry of userScores) {
      if (entry.score < lowest.score) {
        lowest = { score: entry.score, quizId: entry.quiz.id, quizTitle: entry.quiz.title };
      }
    }

    if (lowest.score === 100) {
      const newQuiz = await this.repository.findFirstSummaryNotIn(
        userScores.map((entry) => entry.quiz.id),
      );
      if (newQuiz) {
        return {
          recommendedQuiz: newQuiz,
          reason: "You've mastered the others, try this new challenge!",
        };
      }
    }

    const retakeQuiz = await this.repository.findSummaryById(lowest.quizId);
    return {
      recommendedQuiz: retakeQuiz,
      reason: `Improve your score on "${lowest.quizTitle}" (current: ${lowest.score}%)`,
      currentScore: lowest.score,
    };
  }
}
