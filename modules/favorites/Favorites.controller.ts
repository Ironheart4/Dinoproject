import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type { FavoritesService } from "./Favorites.service";
import type { AddFavoriteBody, FavoriteDinoIdParams } from "./Favorites.schemas";

/**
 * HTTP adapter for favorites. Maps service results to existing response shapes.
 */
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  listFavorites = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const favorites = await this.service.listFavorites(requireUserId(req));
    res.json(favorites);
  });

  checkFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { dinoId } = req.params as unknown as FavoriteDinoIdParams;
    const result = await this.service.checkFavorite(requireUserId(req), dinoId);
    res.json(result);
  });

  addFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { dinoId } = req.body as AddFavoriteBody;
    const result = await this.service.addFavorite(requireUserId(req), dinoId);
    if (result.created) {
      res.status(201).json(result.favorite);
      return;
    }
    res.status(200).json(result.favorite);
  });

  removeFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { dinoId } = req.params as unknown as FavoriteDinoIdParams;
    const result = await this.service.removeFavorite(requireUserId(req), dinoId);
    res.json(result);
  });
}

function requireUserId(req: Request): string {
  if (!req.user?.id) throw new UnauthorizedError("Invalid token");
  return req.user.id;
}
