import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { SubscriptionController } from "./Subscription.controller";
import { SubscriptionRepository } from "./Subscription.repository";
import {
  createSubscriptionBodySchema,
  subscriptionEmptyQuerySchema,
} from "./Subscription.schemas";
import { SubscriptionService } from "./Subscription.service";

export interface SubscriptionRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
}

/**
 * Subscription routes (authenticated GET/DELETE; admin POST).
 */
export function createSubscriptionRouter(deps: SubscriptionRouterDeps): Router {
  const repository = new SubscriptionRepository(deps.getPrisma);
  const service = new SubscriptionService(repository);
  const controller = new SubscriptionController(service);

  const router = Router();

  router.get(
    "/api/subscription",
    deps.authMiddleware,
    validateRequest(subscriptionEmptyQuerySchema, "query"),
    controller.getSubscription,
  );

  router.post(
    "/api/subscription",
    deps.authMiddleware,
    deps.adminMiddleware,
    validateRequest(createSubscriptionBodySchema, "body", "plan required"),
    controller.createSubscription,
  );

  router.delete(
    "/api/subscription",
    deps.authMiddleware,
    validateRequest(subscriptionEmptyQuerySchema, "query"),
    controller.cancelSubscription,
  );

  return router;
}
