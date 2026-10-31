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

export function createAnalyticsRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// ANALYTICS ENDPOINTS (Admin only)
router.get("/api/analytics", deps.authMiddleware, deps.adminMiddleware, async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get counts
    const [
      totalUsers,
      totalDinosaurs,
      totalQuizzes,
      premiumSubscribers,
      usersLast7Days,
      usersLast30Days,
      quizCompletions,
      recentScores,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.dinosaur.count(),
      prisma.quiz.count(),
      prisma.subscription.count({ where: { plan: "premium", status: "active" } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.score.count(),
      prisma.score.findMany({
        take: 100,
        orderBy: { completedAt: "desc" },
        include: { user: { select: { name: true } }, quiz: { select: { title: true } } },
      }),
    ]);

    // Get user registrations by day for the last 30 days
    const usersByDay = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Aggregate by date
    const dailyRegistrations: { [key: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyRegistrations[dateStr] = 0;
    }
    usersByDay.forEach((entry) => {
      const dateStr = new Date(entry.createdAt).toISOString().split("T")[0];
      if (dailyRegistrations[dateStr] !== undefined) {
        dailyRegistrations[dateStr]++;
      }
    });

    // Get subscription breakdown

    // Calculate free users (users without premium subscription)
    const freeUsers = totalUsers - premiumSubscribers;

    res.json({
      overview: {
        totalUsers,
        totalDinosaurs,
        totalQuizzes,
        premiumSubscribers,
        freeUsers,
        usersLast7Days,
        usersLast30Days,
        quizCompletions,
      },
      charts: {
        dailyRegistrations: Object.entries(dailyRegistrations).map(([date, count]) => ({
          date,
          count,
        })),
        subscriptionBreakdown: [
          { plan: "Free", count: freeUsers },
          { plan: "Premium", count: premiumSubscribers },
        ],
      },
      recentActivity: recentScores.slice(0, 10).map((s) => ({
        user: s.user.name,
        quiz: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ==================== FORUM ENDPOINTS ====================

// Get all forum categories

  return router;
}
