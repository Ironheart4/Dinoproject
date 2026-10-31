import { Router } from "express";
import type { PrismaClient } from "@prisma/client";

export function createHealthRouter(getPrisma: () => PrismaClient | undefined = () => undefined): Router {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  router.get("/health/db", async (_req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ status: "error", detail: "Database unavailable" });
    try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ok", database: "connected" }); }
    catch (error) { res.status(503).json({ status: "error", detail: String(error) }); }
  });
  return router;
}
