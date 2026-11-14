import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { CaptureOrderBody, CreateOrderBody } from "./Paypal.schemas";
import type { PaypalService } from "./Paypal.service";

function requireUserId(req: Request): string {
  if (!req.user?.id) throw new UnauthorizedError("Invalid token");
  return req.user.id;
}

/**
 * HTTP adapter for PayPal checkout. Maps service results to existing response shapes.
 */
export class PaypalController {
  constructor(private readonly service: PaypalService) {}

  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.createOrder(requireUserId(req), req.body as CreateOrderBody));
  });

  captureOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body as CaptureOrderBody;
    res.json(await this.service.captureOrder(requireUserId(req), orderId));
  });

  clientId = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(this.service.getClientId());
  });
}
