import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "../../core/errors";
import type { ForumRepository } from "../../modules/forum/Forum.repository";
import { ForumService } from "../../modules/forum/Forum.service";

function mockRepository(overrides: Partial<ForumRepository> = {}): ForumRepository {
  return {
    findCategoriesWithPostCount: vi.fn().mockResolvedValue([]),
    findRecentPosts: vi.fn().mockResolvedValue([]),
    findCategoryBySlugWithPosts: vi.fn().mockResolvedValue(null),
    incrementViewCount: vi.fn().mockResolvedValue(false),
    findPostWithReplies: vi.fn().mockResolvedValue(null),
    findCategoryById: vi.fn().mockResolvedValue(null),
    createPost: vi.fn(),
    findPostLockState: vi.fn().mockResolvedValue(null),
    createReply: vi.fn(),
    ...overrides,
  } as unknown as ForumRepository;
}

describe("ForumService", () => {
  it("asks for the 10 most recent posts", async () => {
    const findRecentPosts = vi.fn().mockResolvedValue([]);
    await new ForumService(mockRepository({ findRecentPosts })).listRecentPosts();
    expect(findRecentPosts).toHaveBeenCalledWith(10);
  });

  it("getCategory throws NotFoundError for an unknown slug", async () => {
    await expect(new ForumService(mockRepository()).getCategory("nope")).rejects.toThrow(NotFoundError);
  });

  it("getPost returns 404 when the post does not exist (no view counted)", async () => {
    const findPostWithReplies = vi.fn();
    const service = new ForumService(mockRepository({ findPostWithReplies }));
    await expect(service.getPost(5)).rejects.toThrow("Post not found");
    expect(findPostWithReplies).not.toHaveBeenCalled();
  });

  it("getPost counts a view and returns the post", async () => {
    const post = { id: 5, title: "Hi", replies: [] };
    const incrementViewCount = vi.fn().mockResolvedValue(true);
    const service = new ForumService(
      mockRepository({ incrementViewCount, findPostWithReplies: vi.fn().mockResolvedValue(post) }),
    );
    await expect(service.getPost(5)).resolves.toEqual(post);
    expect(incrementViewCount).toHaveBeenCalledWith(5);
  });

  it("createPost rejects an unknown category", async () => {
    const service = new ForumService(mockRepository());
    await expect(service.createPost("u1", { categoryId: 9, title: "T", content: "C" })).rejects.toThrow(
      "Category not found",
    );
  });

  it("createPost saves with the author id", async () => {
    const createPost = vi.fn().mockResolvedValue({ id: 1 });
    const service = new ForumService(
      mockRepository({ findCategoryById: vi.fn().mockResolvedValue({ id: 2 }), createPost }),
    );
    await service.createPost("u1", { categoryId: 2, title: "T", content: "C" });
    expect(createPost).toHaveBeenCalledWith({ categoryId: 2, userId: "u1", title: "T", content: "C" });
  });

  it("createReply rejects missing posts with 404 and locked posts with 403", async () => {
    await expect(new ForumService(mockRepository()).createReply("u1", 1, "hi")).rejects.toThrow(NotFoundError);

    const locked = new ForumService(
      mockRepository({ findPostLockState: vi.fn().mockResolvedValue({ id: 1, isLocked: true }) }),
    );
    await expect(locked.createReply("u1", 1, "hi")).rejects.toThrow(ForbiddenError);
  });

  it("createReply saves a reply on an open post", async () => {
    const createReply = vi.fn().mockResolvedValue({ id: 3 });
    const service = new ForumService(
      mockRepository({ findPostLockState: vi.fn().mockResolvedValue({ id: 1, isLocked: false }), createReply }),
    );
    await expect(service.createReply("u1", 1, "hello")).resolves.toEqual({ id: 3 });
    expect(createReply).toHaveBeenCalledWith({ postId: 1, userId: "u1", content: "hello" });
  });
});
