import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import type { PaymentProvider } from "../../infrastructure/payments/PaymentProvider";
import { validateRequest } from "../../middleware/validateRequest";
import { PaypalController } from "./Paypal.controller";
import { PaypalRepository } from "./Paypal.repository";
import { captureOrderBodySchema, createOrderBodySchema, paypalEmptyQuerySchema } from "./Paypal.schemas";
import { PaypalService } from "./Paypal.service";

export interface PaypalRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  paymentProvider: PaymentProvider;
  frontendUrl: string;
}

/** PayPal checkout routes: login required to create and capture; the client id is public. */
export function createPaypalRouter(deps: PaypalRouterDeps): Router {
  const repository = new PaypalRepository(deps.getPrisma);
  const service = new PaypalService(repository, deps.paymentProvider, { frontendUrl: deps.frontendUrl });
  const controller = new PaypalController(service);

  const router = Router();

  router.post(
    "/api/paypal/create-order",
    deps.authMiddleware,
    validateRequest(createOrderBodySchema, "body"),
    controller.createOrder,
  );
  router.post(
    "/api/paypal/capture-order",
    deps.authMiddleware,
    validateRequest(captureOrderBodySchema, "body", "Valid orderId required"),
    controller.captureOrder,
  );
  router.get("/api/paypal/client-id", validateRequest(paypalEmptyQuerySchema, "query"), controller.clientId);

  return router;
}
