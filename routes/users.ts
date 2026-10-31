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

export function createUsersRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// USER MANAGEMENT ENDPOINTS (Admin only)
router.get("/api/users", deps.authMiddleware, deps.adminMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Map subscription data to flat structure for frontend
    const mappedUsers = users.map(user => ({
      ...user,
      subscriptionTier: user.subscription?.plan || 'free',
      subscriptionStatus: user.subscription?.status || 'active',
    }));
    res.json(mappedUsers);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/api/users/:id/role", deps.authMiddleware, deps.adminMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }
    if (id === req.user.id && role !== "admin") {
      return res.status(400).json({ error: "You cannot demote yourself" });
    }
    if (role !== "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === "admin" && adminCount <= 1) {
        return res.status(400).json({ error: "The last admin cannot be demoted" });
      }
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
    res.json(user);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});


  return router;
}
