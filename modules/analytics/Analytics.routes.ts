import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { AnalyticsController } from "./Analytics.controller";
import { AnalyticsRepository } from "./Analytics.repository";
import { analyticsEmptyQuerySchema } from "./Analytics.schemas";
import { AnalyticsService } from "./Analytics.service";

export interface AnalyticsRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
}

/**
 * Admin analytics routes.
 */
export function createAnalyticsRouter(deps: AnalyticsRouterDeps): Router {
  const repository = new AnalyticsRepository(deps.getPrisma);
  const service = new AnalyticsService(repository);
  const controller = new AnalyticsController(service);

  const router = Router();

  router.get(
    "/api/analytics",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(analyticsEmptyQuerySchema, "query"),
    controller.getAnalytics,
  );

  return router;
}
