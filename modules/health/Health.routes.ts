import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { HealthController } from "./Health.controller";
import { HealthRepository } from "./Health.repository";
import { healthEmptyQuerySchema } from "./Health.schemas";
import { HealthService } from "./Health.service";

/**
 * Public health routes. Auth is intentionally omitted (contract: public).
 */
export function createHealthRouter(
  getPrisma: () => PrismaClient | undefined = () => undefined,
): Router {
  const repository = new HealthRepository(getPrisma);
  const service = new HealthService(repository);
  const controller = new HealthController(service);

  const router = Router();
  router.get(
    "/health",
    validateRequest(healthEmptyQuerySchema, "query"),
    controller.getHealth,
  );
  router.get(
    "/health/db",
    validateRequest(healthEmptyQuerySchema, "query"),
    controller.getDatabaseHealth,
  );
  return router;
}
