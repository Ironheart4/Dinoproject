import type { ForumCategory, ForumPost, ForumReply, PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

const AUTHOR = { select: { id: true, name: true, role: true } } as const;
const CATEGORY_REF = { select: { id: true, name: true, slug: true } } as const;

/** Prisma error code for "record to update does not exist". */
const RECORD_NOT_FOUND = "P2025";

function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === RECORD_NOT_FOUND
  );
}

/**
 * Prisma access for the forum. Only repositories touch Prisma.
 */
export class ForumRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findCategoriesWithPostCount() {
    return this.requirePrisma().forumCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    });
  }

  findRecentPosts(limit: number) {
    return this.requirePrisma().forumPost.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: AUTHOR,
        category: CATEGORY_REF,
        _count: { select: { replies: true } },
      },
    });
  }

  findCategoryBySlugWithPosts(slug: string) {
    return this.requirePrisma().forumCategory.findUnique({
      where: { slug },
      include: {
        posts: {
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          include: { user: AUTHOR, _count: { select: { replies: true } } },
        },
      },
    });
  }

  /** Returns false when the post does not exist. */
  async incrementViewCount(postId: number): Promise<boolean> {
    try {
      await this.requirePrisma().forumPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }

  findPostWithReplies(postId: number) {
    return this.requirePrisma().forumPost.findUnique({
      where: { id: postId },
      include: {
        user: AUTHOR,
        category: CATEGORY_REF,
        replies: { orderBy: { createdAt: "asc" }, include: { user: AUTHOR } },
      },
    });
  }

  findCategoryById(id: number): Promise<ForumCategory | null> {
    return this.requirePrisma().forumCategory.findUnique({ where: { id } });
  }

  createPost(data: { categoryId: number; userId: string; title: string; content: string }) {
    return this.requirePrisma().forumPost.create({
      data,
      include: { user: AUTHOR, category: CATEGORY_REF },
    });
  }

  findPostLockState(postId: number): Promise<Pick<ForumPost, "id" | "isLocked"> | null> {
    return this.requirePrisma().forumPost.findUnique({
      where: { id: postId },
      select: { id: true, isLocked: true },
    });
  }

  /** Creates the reply and bumps the post's reply count in one transaction. */
  createReply(data: { postId: number; userId: string; content: string }) {
    return this.requirePrisma().$transaction(async (tx) => {
      const reply: ForumReply & { user: { id: string; name: string | null; role: string } } =
        await tx.forumReply.create({ data, include: { user: AUTHOR } });
      await tx.forumPost.update({
        where: { id: data.postId },
        data: { replyCount: { increment: 1 } },
      });
      return reply;
    });
  }
}
