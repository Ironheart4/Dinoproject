import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthUser } from "../../core/types";
import type { SubscriptionService } from "./Subscription.service";

/**
 * HTTP adapter for subscriptions.
 */
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  getSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const payload = await this.service.getForUser(user.id);
    res.json(payload);
  });

  createSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const { plan, paypalSubscriptionId } = req.body as {
      plan: string;
      paypalSubscriptionId?: string;
    };
    const subscription = await this.service.upsertForUser(
      user.id,
      plan,
      paypalSubscriptionId,
    );
    res.json(subscription);
  });

  cancelSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const payload = await this.service.cancelForUser(user.id);
    res.json(payload);
  });
}
