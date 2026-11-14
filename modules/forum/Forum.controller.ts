import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type {
  CategorySlugParams,
  CreatePostBody,
  CreateReplyBody,
  PostIdParams,
} from "./Forum.schemas";
import type { ForumService } from "./Forum.service";

function requireUserId(req: Request): string {
  if (!req.user?.id) throw new UnauthorizedError("Invalid token");
  return req.user.id;
}

/**
 * HTTP adapter for the forum. Maps service results to existing response shapes.
 */
export class ForumController {
  constructor(private readonly service: ForumService) {}

  categories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listCategories());
  });

  recentPosts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.listRecentPosts());
  });

  category = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params as unknown as CategorySlugParams;
    res.json(await this.service.getCategory(slug));
  });

  post = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as PostIdParams;
    res.json(await this.service.getPost(id));
  });

  createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const post = await this.service.createPost(requireUserId(req), req.body as CreatePostBody);
    res.status(201).json(post);
  });

  createReply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as PostIdParams;
    const { content } = req.body as CreateReplyBody;
    const reply = await this.service.createReply(requireUserId(req), id, content);
    res.status(201).json(reply);
  });
}
