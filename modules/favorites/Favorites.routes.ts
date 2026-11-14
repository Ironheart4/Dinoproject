import { Router, type RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { FavoritesController } from "./Favorites.controller";
import { FavoritesRepository } from "./Favorites.repository";
import {
  addFavoriteBodySchema,
  favoriteDinoIdParamsSchema,
} from "./Favorites.schemas";
import { FavoritesService } from "./Favorites.service";

export interface FavoritesRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
}

/**
 * Authenticated favorites routes. Paths and response shapes match Phase 1.
 * Mount order: check/:dinoId before DELETE /:dinoId.
 */
export function createFavoritesRouter(deps: FavoritesRouterDeps): Router {
  const repository = new FavoritesRepository(deps.getPrisma);
  const service = new FavoritesService(repository);
  const controller = new FavoritesController(service);

  const router = Router();

  router.get("/api/favorites", deps.authMiddleware, controller.listFavorites);

  router.get(
    "/api/favorites/check/:dinoId",
    deps.authMiddleware,
    validateRequest(favoriteDinoIdParamsSchema, "params", "Invalid dinosaur id"),
    controller.checkFavorite,
  );

  router.post(
    "/api/favorites",
    deps.authMiddleware,
    validateRequest(addFavoriteBodySchema, "body", "Valid dinoId or dinosaurId required"),
    controller.addFavorite,
  );

  router.delete(
    "/api/favorites/:dinoId",
    deps.authMiddleware,
    validateRequest(favoriteDinoIdParamsSchema, "params", "Invalid dinosaur id"),
    controller.removeFavorite,
  );

  return router;
}
