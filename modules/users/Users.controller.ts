import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthUser } from "../../core/types";
import type { UsersService } from "./Users.service";

/**
 * HTTP adapter for admin user management.
 */
export class UsersController {
  constructor(private readonly service: UsersService) {}

  listUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await this.service.listUsers();
    res.json(users);
  });

  updateRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: "user" | "admin" };
    const actor = (req as Request & { user: AuthUser }).user;
    const user = await this.service.updateRole(id, role, actor.id);
    res.json(user);
  });
}
