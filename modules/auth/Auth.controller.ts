import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { LoginBody, RefreshBody, RegisterBody } from "./Auth.schemas";
import type { AuthService } from "./Auth.service";

/**
 * HTTP adapter for authentication. Maps service results to existing response shapes.
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.register(req.body as RegisterBody));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.login(req.body as LoginBody));
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];
    res.json(await this.service.logout(token));
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as RefreshBody;
    res.json(await this.service.refresh(refreshToken));
  });

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) throw new UnauthorizedError("Invalid token");
    res.json(await this.service.me(req.user.id, req.user.email));
  });
}
