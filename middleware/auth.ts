import type { NextFunction, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createAuthMiddleware(supabase: SupabaseClient, prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: "Invalid token" });
      let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
            role: "user",
          },
        });
      }
      req.user = { id: dbUser.id, name: dbUser.name, role: dbUser.role, email: user.email };
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  };
}
