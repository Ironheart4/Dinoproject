import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter?: RequestHandler;
  aiLimiter?: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

export function createDashboardRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// DASHBOARD ENDPOINTS

// Get comprehensive dashboard stats
router.get("/api/dashboard/stats", deps.authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    // Get favorites count
    const favoritesCount = await prisma.favorite.count({
      where: { userId },
    });

    // Get quiz stats
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
    });

    const quizzesCompleted = scores.length;
    const highestScore = scores.length > 0
      ? Math.max(...scores.map(s => s.score))
      : 0;
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;

    // Calculate activity streak (days since account creation)
    const createdAt = new Date(user?.createdAt || Date.now());
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: req.user.email,
        bio: user?.bio,
        profilePic: user?.profilePic,
        createdAt: user?.createdAt,
      },
      subscription: user?.subscription || { plan: "free", status: "active" },
      stats: {
        favoritesCount,
        quizzesCompleted,
        highestScore,
        averageScore,
        activityStreak: daysSinceCreated,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Get chart data for dashboard
router.get("/api/dashboard/charts", deps.authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get favorites with dinosaur details for charts
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
    });

    // Get quiz scores over time
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "asc" },
    });

    // Bar chart: Top 5 Dinosaur Types by favorites
    const typeCount: Record<string, number> = {};
    favorites.forEach(f => {
      const type = f.dinosaur.type || "Unknown";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Pie chart: Favorite Dino Diets
    const dietCount: Record<string, number> = {};
    favorites.forEach(f => {
      const diet = f.dinosaur.diet || "Unknown";
      dietCount[diet] = (dietCount[diet] || 0) + 1;
    });
    const diets = Object.entries(dietCount).map(([diet, count]) => ({ diet, count }));

    // Line chart: Quiz scores over time
    const quizProgress = scores.map(s => ({
      date: s.completedAt.toISOString().split("T")[0],
      score: s.score,
      quizTitle: s.quiz.title,
    }));

    res.json({
      topTypes,
      diets,
      quizProgress,
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Get recent activity
router.get("/api/dashboard/activity", deps.authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get all favorites with dates
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
      orderBy: { createdAt: "desc" },
    });

    // Get all quiz scores
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    });

    res.json({
      favorites: favorites.map(f => ({
        id: f.id,
        dinosaurId: f.dinoId,
        dinosaurName: f.dinosaur.name || f.dinosaur.species,
        date: f.createdAt,
      })),
      quizzes: scores.map(s => ({
        id: s.id,
        quizId: s.quizId,
        quizTitle: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard activity error:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Update user profile (name, bio)

  return router;
}
