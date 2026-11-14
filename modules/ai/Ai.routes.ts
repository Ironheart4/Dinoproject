import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import type { AiProvider } from "../../infrastructure/ai/AiProvider";
import { validateRequest } from "../../middleware/validateRequest";
import { AiController } from "./Ai.controller";
import { createLocalDinoResponder } from "./Ai.localResponder";
import { AiRepository } from "./Ai.repository";
import { chatBodySchema } from "./Ai.schemas";
import { AiService } from "./Ai.service";

export interface AiRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  aiLimiter: RequestHandler;
  aiProvider: AiProvider;
}

/** DinoBot route. The AI rate limiter runs before authentication (kept from the old route). */
export function createAiRouter(deps: AiRouterDeps): Router {
  const repository = new AiRepository(deps.getPrisma);
  const fallback = createLocalDinoResponder(deps.getPrisma).respond;
  const service = new AiService(repository, deps.aiProvider, fallback);
  const controller = new AiController(service);

  const router = Router();
  router.post(
    "/api/ai/chat",
    deps.aiLimiter,
    deps.authMiddleware,
    validateRequest(chatBodySchema, "body"),
    controller.chat,
  );
  return router;
}
