import { ForbiddenError, NotFoundError } from "../../core/errors";
import type { ForumRepository } from "./Forum.repository";

const RECENT_POSTS_LIMIT = 10;

/**
 * Forum domain logic. No Express types here.
 */
export class ForumService {
  constructor(private readonly repository: ForumRepository) {}

  listCategories() {
    return this.repository.findCategoriesWithPostCount();
  }

  listRecentPosts() {
    return this.repository.findRecentPosts(RECENT_POSTS_LIMIT);
  }

  async getCategory(slug: string) {
    const category = await this.repository.findCategoryBySlugWithPosts(slug);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  }

  /** Counts a view, then returns the post with its replies. Unknown posts return 404. */
  async getPost(postId: number) {
    const exists = await this.repository.incrementViewCount(postId);
    if (!exists) throw new NotFoundError("Post not found");
    const post = await this.repository.findPostWithReplies(postId);
    if (!post) throw new NotFoundError("Post not found");
    return post;
  }

  async createPost(userId: string, input: { categoryId: number; title: string; content: string }) {
    const category = await this.repository.findCategoryById(input.categoryId);
    if (!category) throw new NotFoundError("Category not found");
    return this.repository.createPost({ ...input, userId });
  }

  /** Replies are rejected for missing posts (404) and locked posts (403). */
  async createReply(userId: string, postId: number, content: string) {
    const post = await this.repository.findPostLockState(postId);
    if (!post) throw new NotFoundError("Post not found");
    if (post.isLocked) throw new ForbiddenError("This post is locked");
    return this.repository.createReply({ postId, userId, content });
  }
}
