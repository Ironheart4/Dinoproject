import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { SearchService } from "./Search.service";

/**
 * HTTP adapter for public search. Maps service results to existing response shapes.
 */
export class SearchController {
  constructor(private readonly service: SearchService) {}

  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const payload = await this.service.search(q);
    res.json(payload);
  });
}
