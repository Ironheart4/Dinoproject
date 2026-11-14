import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { SearchController } from "./Search.controller";
import { SearchRepository } from "./Search.repository";
import { searchQuerySchema } from "./Search.schemas";
import { SearchService } from "./Search.service";

/**
 * Public search routes. Auth is intentionally omitted (contract: public).
 */
export function createSearchRouter(
  getPrisma: () => PrismaClient | undefined = () => undefined,
): Router {
  const repository = new SearchRepository(getPrisma);
  const service = new SearchService(repository);
  const controller = new SearchController(service);

  const router = Router();
  router.get(
    "/api/search",
    validateRequest(searchQuerySchema, "query"),
    controller.search,
  );
  return router;
}
