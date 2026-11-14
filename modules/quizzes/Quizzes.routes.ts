import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { QuizzesController } from "./Quizzes.controller";
import { QuizzesRepository } from "./Quizzes.repository";
import {
  QUIZ_BODY_INVALID_MESSAGE,
  createQuizBodySchema,
  quizIdParamsSchema,
  quizzesEmptyQuerySchema,
  randomQuestionsQuerySchema,
  updateQuizBodySchema,
} from "./Quizzes.schemas";
import { QuizzesService } from "./Quizzes.service";

export interface QuizzesRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
}

/**
 * Quiz routes: public reads, admin-only writes, authenticated recommendations.
 * Mount order: `/api/quizzes/recommend` is registered before `/api/quizzes/:id`.
 */
export function createQuizzesRouter(deps: QuizzesRouterDeps): Router {
  const repository = new QuizzesRepository(deps.getPrisma);
  const service = new QuizzesService(repository);
  const controller = new QuizzesController(service);

  const router = Router();
  const invalidId = "Invalid quiz id";

  router.get("/api/quizzes", controller.list);

  router.post(
    "/api/quizzes",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(createQuizBodySchema, "body"),
    controller.create,
  );

  router.delete(
    "/api/quizzes/:id",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(quizIdParamsSchema, "params", invalidId),
    controller.remove,
  );

  router.get(
    "/api/quizzes/recommend",
    deps.authMiddleware,
    validateRequest(quizzesEmptyQuerySchema, "query"),
    controller.recommend,
  );

  router.get(
    "/api/quizzes/:id",
    validateRequest(quizIdParamsSchema, "params", invalidId),
    controller.get,
  );

  router.put(
    "/api/quizzes/:id",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(quizIdParamsSchema, "params", invalidId),
    validateRequest(updateQuizBodySchema, "body", QUIZ_BODY_INVALID_MESSAGE),
    controller.update,
  );

  router.get(
    "/api/quiz/random",
    validateRequest(randomQuestionsQuerySchema, "query"),
    controller.random,
  );

  return router;
}
