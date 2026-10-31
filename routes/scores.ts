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

export function createScoresRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
router.get("/api/scores/me", deps.authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
    });
    res.json(scores);
  } catch (error) {
    console.error("Fetch scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

router.post("/api/scores", deps.authMiddleware, async (req: any, res) => {
  try {
    const { quizId, score } = req.body;
    const parsedQuizId = parsePositiveInt(quizId);
    const parsedScore = parseBoundedNumber(score, 0, 100);
    if (!parsedQuizId || parsedScore === null || !Number.isInteger(parsedScore)) {
      return res.status(400).json({ error: "quizId must be a positive integer and score must be an integer from 0 to 100" });
    }
    const result = await prisma.score.create({
      data: { userId: req.user.id, quizId: parsedQuizId, score: parsedScore },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Save score error:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

router.get("/api/scores", deps.authMiddleware, async (req: any, res) => {
  try {
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    });
    res.json(scores);
  } catch (error) {
    console.error("Fetch scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});


  return router;
}
