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

export function createSubscriptionRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// SUBSCRIPTIONS ENDPOINTS
router.get("/api/subscription", deps.authMiddleware, async (req: any, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription) {
      return res.json({ plan: "free", status: "active" });
    }

    // Check if donor subscription has expired (past endDate)
    if (subscription.plan === 'donor' && subscription.endDate) {
      const now = new Date();
      if (now > new Date(subscription.endDate)) {
        // Update status to expired if not already
        if (subscription.status !== 'expired') {
          await prisma.subscription.update({
            where: { userId: req.user.id },
            data: { status: 'expired' }
          });
        }
        return res.json({ ...subscription, status: 'expired', donorExpired: true });
      }
    }

    res.json(subscription);
  } catch (error) {
    console.error("Fetch subscription error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.post("/api/subscription", deps.authMiddleware, deps.adminMiddleware, async (req: any, res) => {
  try {
    const { plan, paypalSubscriptionId } = req.body;
    if (!plan) return res.status(400).json({ error: "plan required" });

    const endDate = new Date();
    if (plan === "premium") {
      endDate.setMonth(endDate.getMonth() + 1); // 1 month for premium
    } else if (plan === "donor") {
      endDate.setMonth(endDate.getMonth() + 6); // 6 months for donor
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: { plan, status: "active", startDate: new Date(), endDate, paypalSubscriptionId },
      create: { userId: req.user.id, plan, status: "active", endDate, paypalSubscriptionId },
    });
    res.json(subscription);
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

router.delete("/api/subscription", deps.authMiddleware, async (req: any, res) => {
  try {
    await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { status: "cancelled" },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});


  return router;
}
