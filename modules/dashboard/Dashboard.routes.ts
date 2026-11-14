import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { DashboardController } from "./Dashboard.controller";
import { DashboardRepository } from "./Dashboard.repository";
import { dashboardEmptyQuerySchema } from "./Dashboard.schemas";
import { DashboardService } from "./Dashboard.service";

export interface DashboardRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
}

/** Authenticated dashboard routes (auth is required on every route). */
export function createDashboardRouter(deps: DashboardRouterDeps): Router {
  const repository = new DashboardRepository(deps.getPrisma);
  const service = new DashboardService(repository);
  const controller = new DashboardController(service);

  const router = Router();
  const query = validateRequest(dashboardEmptyQuerySchema, "query");

  router.get("/api/dashboard/stats", deps.authMiddleware, query, controller.stats);
  router.get("/api/dashboard/charts", deps.authMiddleware, query, controller.charts);
  router.get("/api/dashboard/activity", deps.authMiddleware, query, controller.activity);

  return router;
}
