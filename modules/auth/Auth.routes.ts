import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import type { AuthProvider } from "../../infrastructure/auth/AuthProvider";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./Auth.controller";
import { AuthRepository } from "./Auth.repository";
import {
  authEmptyQuerySchema,
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "./Auth.schemas";
import { AuthService } from "./Auth.service";

export interface AuthRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authProvider: AuthProvider;
  authMiddleware: RequestHandler;
  authLimiter: RequestHandler;
}

/** Auth routes: register and login are rate limited; `me` requires a valid token. */
export function createAuthRouter(deps: AuthRouterDeps): Router {
  const repository = new AuthRepository(deps.getPrisma);
  const service = new AuthService(deps.authProvider, repository);
  const controller = new AuthController(service);

  const router = Router();

  router.post("/api/auth/register", deps.authLimiter, validateRequest(registerBodySchema, "body"), controller.register);
  router.post("/api/auth/login", deps.authLimiter, validateRequest(loginBodySchema, "body"), controller.login);
  router.post("/api/auth/logout", controller.logout);
  router.post("/api/auth/refresh", validateRequest(refreshBodySchema, "body"), controller.refresh);
  router.get(
    "/api/auth/me",
    deps.authMiddleware,
    validateRequest(authEmptyQuerySchema, "query"),
    controller.me,
  );

  return router;
}
