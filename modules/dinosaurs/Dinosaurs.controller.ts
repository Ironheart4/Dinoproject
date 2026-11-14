import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { DinosaurBody, DinosaurIdParams } from "./Dinosaurs.schemas";
import type { DinosaursService } from "./Dinosaurs.service";

/**
 * HTTP adapter for dinosaurs. Maps service results to existing response shapes.
 */
export class DinosaursController {
  constructor(private readonly service: DinosaursService) {}

  list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list());
  });

  featured = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.featured());
  });

  get = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as DinosaurIdParams;
    res.json(await this.service.get(id));
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dinosaur = await this.service.create(req.body as DinosaurBody);
    res.status(201).json(dinosaur);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as DinosaurIdParams;
    res.json(await this.service.update(id, req.body as DinosaurBody));
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as DinosaurIdParams;
    res.json(await this.service.remove(id));
  });
}
