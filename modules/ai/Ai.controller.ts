import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { ChatBody } from "./Ai.schemas";
import type { AiService } from "./Ai.service";

/**
 * HTTP adapter for DinoBot. Maps service results to existing response shapes.
 */
export class AiController {
  constructor(private readonly service: AiService) {}

  chat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    if (!user?.id) throw new UnauthorizedError("Authentication required");
    const { message } = req.body as ChatBody;
    res.json(await this.service.chat({ id: user.id, role: user.role }, message));
  });
}
