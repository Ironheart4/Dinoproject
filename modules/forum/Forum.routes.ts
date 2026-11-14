import { Router } from "express";
import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { ForumController } from "./Forum.controller";
import { ForumRepository } from "./Forum.repository";
import {
  categorySlugParamsSchema,
  createPostBodySchema,
  createReplyBodySchema,
  forumEmptyQuerySchema,
  postIdParamsSchema,
} from "./Forum.schemas";
import { ForumService } from "./Forum.service";

export interface ForumRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
}

/** Forum routes: public reads, authenticated posting and replying. */
export function createForumRouter(deps: ForumRouterDeps): Router {
  const repository = new ForumRepository(deps.getPrisma);
  const service = new ForumService(repository);
  const controller = new ForumController(service);

  const router = Router();
  const query = validateRequest(forumEmptyQuerySchema, "query");

  router.get("/api/forum/categories", query, controller.categories);
  router.get("/api/forum/posts/recent", query, controller.recentPosts);
  router.get(
    "/api/forum/category/:slug",
    validateRequest(categorySlugParamsSchema, "params"),
    controller.category,
  );
  router.get(
    "/api/forum/post/:id",
    validateRequest(postIdParamsSchema, "params", "Invalid post id"),
    controller.post,
  );
  router.post(
    "/api/forum/posts",
    deps.authMiddleware,
    validateRequest(createPostBodySchema, "body"),
    controller.createPost,
  );
  router.post(
    "/api/forum/posts/:id/replies",
    deps.authMiddleware,
    validateRequest(postIdParamsSchema, "params", "Invalid post id"),
    validateRequest(createReplyBodySchema, "body"),
    controller.createReply,
  );

  return router;
}
