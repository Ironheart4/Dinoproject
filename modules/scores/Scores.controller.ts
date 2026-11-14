import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthUser } from "../../core/types";
import type { CreateScoreBody } from "./Scores.schemas";
import type { ScoresService } from "./Scores.service";

/**
 * HTTP adapter for authenticated scores. Maps service results to existing response shapes.
 */
export class ScoresController {
  constructor(private readonly service: ScoresService) {}

  getMyScores = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const scores = await this.service.getMyScores(user.id);
    res.json(scores);
  });

  createScore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const body = req.body as CreateScoreBody;
    const result = await this.service.createScore({
      userId: user.id,
      quizId: body.quizId,
      score: body.score,
    });
    res.status(201).json(result);
  });

  listScores = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as Request & { user: AuthUser }).user;
    const scores = await this.service.listScores(user.id);
    res.json(scores);
  });
}
