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

export function createSearchRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
router.get("/api/search", async (req, res) => {
  try {
    const query = (req.query.q as string || "").trim().toLowerCase();
    if (!query || query.length < 2) {
      return res.json({ results: { dinosaurs: [], quizzes: [] } });
    }

    // Search dinosaurs by name, species, or type
    const dinosaurs = await prisma.dinosaur.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { species: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } },
          { diet: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, species: true, period: true, imageUrl: true, diet: true },
      take: 8,
      orderBy: { name: "asc" },
    });

    // Search quizzes by title
    const quizzes = await prisma.quiz.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
      },
      select: { id: true, title: true },
      take: 5,
      orderBy: { title: "asc" },
    });

    res.json({
      results: {
        dinosaurs: dinosaurs.map(d => ({
          id: d.id,
          name: d.name,
          species: d.species,
          period: d.period,
          imageUrl: d.imageUrl,
          diet: d.diet,
          type: "dinosaur",
        })),
        quizzes: quizzes.map(q => ({
          id: q.id,
          title: q.title,
          type: "quiz",
        })),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

  return router;
}
