import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { DinosaursController } from "./Dinosaurs.controller";
import { DinosaursRepository } from "./Dinosaurs.repository";
import {
  DINOSAUR_REQUIRED_MESSAGE,
  dinosaurBodySchema,
  dinosaurIdParamsSchema,
} from "./Dinosaurs.schemas";
import { DinosaursService } from "./Dinosaurs.service";

export interface DinosaursRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
}

/**
 * Dinosaur routes: public reads, admin-only writes.
 * Mount order: `/featured` is registered before `/:id`.
 */
export function createDinosaursRouter(deps: DinosaursRouterDeps): Router {
  const repository = new DinosaursRepository(deps.getPrisma);
  const service = new DinosaursService(repository);
  const controller = new DinosaursController(service);

  const router = Router();

  router.get("/api/dinosaurs", controller.list);
  router.get("/api/dinosaurs/featured", controller.featured);

  router.post(
    "/api/dinosaurs",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(dinosaurBodySchema, "body", DINOSAUR_REQUIRED_MESSAGE),
    controller.create,
  );

  router.put(
    "/api/dinosaurs/:id",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(dinosaurIdParamsSchema, "params", "Invalid dinosaur id"),
    validateRequest(dinosaurBodySchema, "body", DINOSAUR_REQUIRED_MESSAGE),
    controller.update,
  );

  router.delete(
    "/api/dinosaurs/:id",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(dinosaurIdParamsSchema, "params", "Invalid dinosaur id"),
    controller.remove,
  );

  router.get(
    "/api/dinosaurs/:id",
    validateRequest(dinosaurIdParamsSchema, "params", "Invalid dinosaur id"),
    controller.get,
  );

  return router;
}
