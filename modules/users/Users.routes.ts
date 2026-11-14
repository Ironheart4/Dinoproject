import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { UsersController } from "./Users.controller";
import { UsersRepository } from "./Users.repository";
import {
  updateUserRoleBodySchema,
  updateUserRoleParamsSchema,
  usersEmptyQuerySchema,
} from "./Users.schemas";
import { UsersService } from "./Users.service";

export interface UsersRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
}

/**
 * Admin user management routes.
 */
export function createUsersRouter(deps: UsersRouterDeps): Router {
  const repository = new UsersRepository(deps.getPrisma);
  const service = new UsersService(repository);
  const controller = new UsersController(service);

  const router = Router();

  router.get(
    "/api/users",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(usersEmptyQuerySchema, "query"),
    controller.listUsers,
  );

  router.put(
    "/api/users/:id/role",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(updateUserRoleParamsSchema, "params"),
    validateRequest(
      updateUserRoleBodySchema,
      "body",
      "Invalid role. Must be 'user' or 'admin'",
    ),
    controller.updateRole,
  );

  return router;
}
