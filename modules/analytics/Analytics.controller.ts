import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AnalyticsService } from "./Analytics.service";

/**
 * HTTP adapter for admin analytics.
 */
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  getAnalytics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const payload = await this.service.getAnalytics();
    res.json(payload);
  });
}
