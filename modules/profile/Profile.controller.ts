import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { UpdateProfileBody } from "./Profile.schemas";
import type { ProfileService } from "./Profile.service";

function requireUser(req: Request): { id: string; email?: string } {
  if (!req.user?.id) throw new UnauthorizedError("Invalid token");
  return { id: req.user.id, email: req.user.email };
}

/**
 * HTTP adapter for the user's own profile. Maps service results to existing response shapes.
 */
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    res.json(await this.service.getMe(user.id, user.email));
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    res.json(await this.service.updateProfile(user.id, user.email, req.body as UpdateProfileBody));
  });

  uploadPicture = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const file = req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined;
    res.json(await this.service.uploadProfilePicture(user.id, file));
  });

  removePicture = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.removeProfilePicture(requireUser(req).id));
  });
}
