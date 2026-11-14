import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { HealthService } from "./Health.service";

/**
 * HTTP adapter for health. Maps service results to existing response shapes.
 */
export class HealthController {
  constructor(private readonly service: HealthService) {}

  getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(this.service.getLiveness());
  });

  getDatabaseHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.getDatabaseHealth();
    if (!result.ok) {
      res.status(503).json({ status: "error", detail: result.detail });
      return;
    }
    res.json({ status: "ok", database: "connected" });
  });
}
