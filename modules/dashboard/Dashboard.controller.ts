import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { DashboardService } from "./Dashboard.service";

function requireUser(req: Request): { id: string; email?: string } {
  if (!req.user?.id) throw new UnauthorizedError("Invalid token");
  return { id: req.user.id, email: req.user.email };
}

/**
 * HTTP adapter for the dashboard. Maps service results to existing response shapes.
 */
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  stats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    res.json(await this.service.getStats(user.id, user.email));
  });

  charts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getCharts(requireUser(req).id));
  });

  activity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getActivity(requireUser(req).id));
  });
}
