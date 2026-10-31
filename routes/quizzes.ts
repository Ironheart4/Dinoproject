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

export function createQuizzesRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// QUIZZES ENDPOINTS
router.get("/api/quizzes", async (_req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({ include: { questions: true } });
    res.json(quizzes);
  } catch (error) {
    console.error("Fetch quizzes error:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

router.post("/api/quizzes", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const { title, questions } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const quiz = await prisma.quiz.create({
      data: {
        title,
        questions: {
          create: questions || [],
        },
      },
      include: { questions: true },
    });
    res.status(201).json(quiz);
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

router.delete("/api/quizzes/:id", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const quizId = parsePositiveInt(id);
    if (!quizId) return res.status(400).json({ error: "Invalid quiz id" });
    await prisma.quiz.delete({ where: { id: quizId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

// Get recommended quiz based on the user's weak areas.
router.get("/api/quizzes/recommend", deps.authMiddleware, async (req: any, res) => {
  try {
    const userScores = await prisma.score.findMany({
      where: { userId: req.user.id },
      include: { quiz: { select: { id: true, title: true } } },
      orderBy: { completedAt: "desc" },
    });

    if (userScores.length === 0) {
      const allQuizzes = await prisma.quiz.findMany({ select: { id: true, title: true } });
      if (allQuizzes.length === 0) return res.status(404).json({ error: "No quizzes available" });
      return res.json({
        recommendedQuiz: allQuizzes[Math.floor(Math.random() * allQuizzes.length)],
        reason: "Try this quiz to get started!",
      });
    }

    let lowestScore = { score: 100, quizId: -1, quizTitle: "" };
    userScores.forEach((score) => {
      if (score.score < lowestScore.score) {
        lowestScore = { score: score.score, quizId: score.quiz.id, quizTitle: score.quiz.title };
      }
    });

    if (lowestScore.score === 100) {
      const newQuiz = await prisma.quiz.findFirst({
        where: { id: { notIn: userScores.map((score) => score.quiz.id) } },
        select: { id: true, title: true },
      });
      if (newQuiz) {
        return res.json({ recommendedQuiz: newQuiz, reason: "You've mastered the others, try this new challenge!" });
      }
    }

    const retakeQuiz = await prisma.quiz.findUnique({
      where: { id: lowestScore.quizId },
      select: { id: true, title: true },
    });
    res.json({
      recommendedQuiz: retakeQuiz,
      reason: `Improve your score on "${lowestScore.quizTitle}" (current: ${lowestScore.score}%)`,
      currentScore: lowestScore.score,
    });
  } catch (error) {
    console.error("Quiz recommendation error:", error);
    res.status(500).json({ error: "Failed to get quiz recommendation" });
  }
});

// GET single quiz by ID
router.get("/api/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const quizId = parsePositiveInt(id);
    if (!quizId) return res.status(400).json({ error: "Invalid quiz id" });
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    console.error("Fetch quiz error:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// UPDATE quiz
router.put("/api/quizzes/:id", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const quizId = parsePositiveInt(id);
    if (!quizId) return res.status(400).json({ error: "Invalid quiz id" });
    const { title, questions } = req.body;

    // Delete existing questions and recreate
    await prisma.question.deleteMany({ where: { quizId } });

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title,
        questions: {
          create: questions || [],
        },
      },
      include: { questions: true },
    });
    res.json(quiz);
  } catch (error) {
    console.error("Update quiz error:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

// GET random questions for quiz (frontend use)
router.get("/api/quiz/random", async (req, res) => {
  try {
    const count = parsePositiveInt(req.query.count) || 10;
    if (count > 100) return res.status(400).json({ error: "count must be 100 or fewer" });

    // Get all questions from all quizzes
    const questions = await prisma.question.findMany({
      include: { quiz: { select: { title: true } } },
    });

    // Shuffle and take requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    res.json(selected);
  } catch (error) {
    console.error("Fetch random questions error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// GET user's quiz history

  return router;
}
