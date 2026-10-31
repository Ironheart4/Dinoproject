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

export function createFavoritesRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// FAVORITES ENDPOINTS
router.get("/api/favorites", deps.authMiddleware, async (req: any, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { dinosaur: true },
    });
    res.json(favorites);
  } catch (error) {
    console.error("Fetch favorites error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Check if a dinosaur is favorited
router.get("/api/favorites/check/:dinoId", deps.authMiddleware, async (req: any, res) => {
  try {
    const { dinoId } = req.params;
    const parsedDinoId = parsePositiveInt(dinoId);
    if (!parsedDinoId) return res.status(400).json({ error: "Invalid dinosaur id" });
    const favorite = await prisma.favorite.findFirst({
      where: { userId: req.user.id, dinoId: parsedDinoId },
    });
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({ error: "Failed to check favorite" });
  }
});

router.post("/api/favorites", deps.authMiddleware, async (req: any, res) => {
  try {
    const { dinoId, dinosaurId } = req.body;
    const id = dinoId || dinosaurId;
    const parsedDinoId = parsePositiveInt(id);
    if (!parsedDinoId) return res.status(400).json({ error: "Valid dinoId or dinosaurId required" });

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: { userId: req.user.id, dinoId: parsedDinoId },
    });
    if (existing) return res.status(200).json(existing);

    // Check user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });

    // Check if subscription is active (and for donor, not expired)
    let isPremiumOrActiveDonor = false;
    if (subscription && subscription.status === 'active') {
      if (subscription.plan === 'premium') {
        isPremiumOrActiveDonor = true;
      } else if (subscription.plan === 'donor' && subscription.endDate) {
        // Donor is active only if within 6-month window
        isPremiumOrActiveDonor = new Date() <= new Date(subscription.endDate);
      }
    }

    // Free users and expired donors can only have 5 favorites
    if (!isPremiumOrActiveDonor) {
      const currentCount = await prisma.favorite.count({
        where: { userId: req.user.id }
      });
      if (currentCount >= 5) {
        return res.status(403).json({
          error: "Free users can only save up to 5 favorites. Upgrade to unlock unlimited favorites!",
          limitReached: true
        });
      }
    }

    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, dinoId: parsedDinoId },
    });
    res.status(201).json(favorite);
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/api/favorites/:dinoId", deps.authMiddleware, async (req: any, res) => {
  try {
    const { dinoId } = req.params;
    const parsedDinoId = parsePositiveInt(dinoId);
    if (!parsedDinoId) return res.status(400).json({ error: "Invalid dinosaur id" });
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, dinoId: parsedDinoId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// SCORES ENDPOINTS

  return router;
}
