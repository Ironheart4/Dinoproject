import type { DashboardRepository, FavoriteWithDinosaur, ScoreWithQuiz } from "./Dashboard.repository";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TOP_TYPES_LIMIT = 5;
const UNKNOWN = "Unknown";

export interface QuizSummaryStats {
  quizzesCompleted: number;
  highestScore: number;
  averageScore: number;
}

/** Pure helper: highest and rounded average score over a user's attempts. */
export function summarizeScores(scores: ReadonlyArray<{ score: number }>): QuizSummaryStats {
  if (scores.length === 0) return { quizzesCompleted: 0, highestScore: 0, averageScore: 0 };
  const total = scores.reduce((sum, entry) => sum + entry.score, 0);
  return {
    quizzesCompleted: scores.length,
    highestScore: Math.max(...scores.map((entry) => entry.score)),
    averageScore: Math.round(total / scores.length),
  };
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const name = key(item);
    counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}

/**
 * Personal dashboard logic (stats, chart data, recent activity). No Express types here.
 */
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getStats(userId: string, email: string | undefined, now: Date = new Date()) {
    const [user, favoritesCount, scores] = await Promise.all([
      this.repository.findUserWithSubscription(userId),
      this.repository.countFavorites(userId),
      this.repository.findScoresWithQuiz(userId, "none"),
    ]);

    const createdAt = new Date(user?.createdAt || now.getTime());
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / MS_PER_DAY);

    return {
      user: {
        id: user?.id,
        name: user?.name,
        email,
        bio: user?.bio,
        profilePic: user?.profilePic,
        createdAt: user?.createdAt,
      },
      subscription: user?.subscription || { plan: "free", status: "active" },
      stats: {
        favoritesCount,
        ...summarizeScores(scores),
        activityStreak: daysSinceCreated,
      },
    };
  }

  async getCharts(userId: string) {
    const [favorites, scores] = await Promise.all([
      this.repository.findFavoritesWithDinosaur(userId, "none"),
      this.repository.findScoresWithQuiz(userId, "asc"),
    ]);

    const topTypes = Object.entries(countBy(favorites, (f) => f.dinosaur.type || UNKNOWN))
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_TYPES_LIMIT)
      .map(([type, count]) => ({ type, count }));

    const diets = Object.entries(countBy(favorites, (f) => f.dinosaur.diet || UNKNOWN)).map(
      ([diet, count]) => ({ diet, count }),
    );

    const quizProgress = scores.map((s: ScoreWithQuiz) => ({
      date: s.completedAt.toISOString().split("T")[0],
      score: s.score,
      quizTitle: s.quiz.title,
    }));

    return { topTypes, diets, quizProgress };
  }

  async getActivity(userId: string) {
    const [favorites, scores] = await Promise.all([
      this.repository.findFavoritesWithDinosaur(userId, "desc"),
      this.repository.findScoresWithQuiz(userId, "desc"),
    ]);

    return {
      favorites: favorites.map((f: FavoriteWithDinosaur) => ({
        id: f.id,
        dinosaurId: f.dinoId,
        dinosaurName: f.dinosaur.name || f.dinosaur.species,
        date: f.createdAt,
      })),
      quizzes: scores.map((s: ScoreWithQuiz) => ({
        id: s.id,
        quizId: s.quizId,
        quizTitle: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    };
  }
}
