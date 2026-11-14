import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ScoresController } from "./Scores.controller";
import { ScoresRepository } from "./Scores.repository";
import {
  CREATE_SCORE_VALIDATION_MESSAGE,
  createScoreBodySchema,
  scoresEmptyQuerySchema,
} from "./Scores.schemas";
import { ScoresService } from "./Scores.service";

/**
 * Authenticated score routes. Auth middleware is required on every route (contract).
 */
export function createScoresRouter(deps: {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
}): Router {
  const repository = new ScoresRepository(deps.getPrisma);
  const service = new ScoresService(repository);
  const controller = new ScoresController(service);

  const router = Router();

  router.get(
    "/api/scores/me",
    deps.authMiddleware,
    validateRequest(scoresEmptyQuerySchema, "query"),
    controller.getMyScores,
  );

  router.post(
    "/api/scores",
    deps.authMiddleware,
    validateRequest(createScoreBodySchema, "body", CREATE_SCORE_VALIDATION_MESSAGE),
    controller.createScore,
  );

  router.get(
    "/api/scores",
    deps.authMiddleware,
    validateRequest(scoresEmptyQuerySchema, "query"),
    controller.listScores,
  );

  return router;
}
