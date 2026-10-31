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

export function createDinosaursRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// DINOSAURS ENDPOINTS
router.get("/api/dinosaurs", async (_req, res) => {
  try {
    const dinos = await prisma.dinosaur.findMany({
      orderBy: { name: "asc" },
    });
    res.json(dinos);
  } catch (error) {
    console.error("Fetch dinos error:", error);
    res.status(500).json({ error: "Failed to fetch dinosaurs" });
  }
});

// GET featured dinosaurs (for homepage)
router.get("/api/dinosaurs/featured", async (_req, res) => {
  try {
    const featured = await prisma.dinosaur.findMany({
      where: {
        OR: [
          { imageUrl1: { not: undefined } },
          { modelUrl: { not: undefined } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    res.json(featured);
  } catch (error) {
    console.error("Fetch featured error:", error);
    res.status(500).json({ error: "Failed to fetch featured dinosaurs" });
  }
});

// CREATE a new dinosaur
router.post("/api/dinosaurs", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const {
      name, species, period, diet, habitat, lengthMeters, weightKg, description,
      modelUrl, roarSound, imageUrl, imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5,
      videoUrl, wikipedia, taxonomy, type, livedIn, namedBy
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "'name' and 'species' are required" });
    }

    const dino = await prisma.dinosaur.create({
      data: {
        name,
        species,
        period: period ?? null,
        diet: diet ?? null,
        habitat: habitat ?? null,
        lengthMeters: lengthMeters ? parseFloat(lengthMeters) : null,
        weightKg: weightKg ? parseInt(weightKg, 10) : null,
        description: description ?? null,
        modelUrl: modelUrl ?? null,
        roarSound: roarSound ?? null,
        imageUrl: imageUrl ?? null,
        imageUrl1: imageUrl1 ?? null,
        imageUrl2: imageUrl2 ?? null,
        imageUrl3: imageUrl3 ?? null,
        imageUrl4: imageUrl4 ?? null,
        imageUrl5: imageUrl5 ?? null,
        videoUrl: videoUrl ?? null,
        wikipedia: wikipedia ?? null,
        taxonomy: taxonomy ?? null,
        type: type ?? null,
        livedIn: livedIn ?? null,
        namedBy: namedBy ?? null,
      },
    });
    res.status(201).json(dino);
  } catch (error) {
    console.error("Create dino error:", error);
    res.status(500).json({ error: "Failed to create dinosaur" });
  }
});

// UPDATE a dinosaur by id
router.put("/api/dinosaurs/:id", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dinosaurId = parsePositiveInt(id);
    if (!dinosaurId) return res.status(400).json({ error: "Invalid dinosaur id" });
    const {
      name, species, period, diet, habitat, lengthMeters, weightKg, description,
      modelUrl, roarSound, imageUrl, imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5,
      videoUrl, wikipedia, taxonomy, type, livedIn, namedBy
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "'name' and 'species' are required" });
    }

    const dino = await prisma.dinosaur.update({
      where: { id: dinosaurId },
      data: {
        name,
        species,
        period: period ?? null,
        diet: diet ?? null,
        habitat: habitat ?? null,
        lengthMeters: lengthMeters ? parseFloat(lengthMeters) : null,
        weightKg: weightKg ? parseInt(weightKg, 10) : null,
        description: description ?? null,
        modelUrl: modelUrl ?? null,
        roarSound: roarSound ?? null,
        imageUrl: imageUrl ?? null,
        imageUrl1: imageUrl1 ?? null,
        imageUrl2: imageUrl2 ?? null,
        imageUrl3: imageUrl3 ?? null,
        imageUrl4: imageUrl4 ?? null,
        imageUrl5: imageUrl5 ?? null,
        videoUrl: videoUrl ?? null,
        wikipedia: wikipedia ?? null,
        taxonomy: taxonomy ?? null,
        type: type ?? null,
        livedIn: livedIn ?? null,
        namedBy: namedBy ?? null,
      },
    });
    res.json(dino);
  } catch (error) {
    console.error("Update dino error:", error);
    res.status(500).json({ error: "Failed to update dinosaur" });
  }
});

// DELETE a dinosaur by id
router.delete("/api/dinosaurs/:id", deps.authMiddleware, deps.adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dinosaurId = parsePositiveInt(id);
    if (!dinosaurId) return res.status(400).json({ error: "Invalid dinosaur id" });
    await prisma.dinosaur.delete({
      where: { id: dinosaurId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete dino error:", error);
    res.status(500).json({ error: "Failed to delete dinosaur" });
  }
});

// GET a single dinosaur by id
router.get("/api/dinosaurs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dinosaurId = parsePositiveInt(id);
    if (!dinosaurId) return res.status(400).json({ error: "Invalid dinosaur id" });
    const dino = await prisma.dinosaur.findUnique({
      where: { id: dinosaurId },
    });
    if (!dino) {
      return res.status(404).json({ error: "Dinosaur not found" });
    }
    res.json(dino);
  } catch (error) {
    console.error("Fetch dino error:", error);
    res.status(500).json({ error: "Failed to fetch dinosaur" });
  }
})


  return router;
}
