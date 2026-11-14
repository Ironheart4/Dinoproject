import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";
import { createForumRouter } from "../../modules/forum/Forum.routes";

const allow: RequestHandler = (req, _res, next) => {
  (req as unknown as { user: unknown }).user = { id: "u1", role: "user", name: null };
  next();
};
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};

function buildApp(prisma: unknown, authMiddleware: RequestHandler = allow) {
  const app = express();
  app.use(express.json());
  app.use(createForumRouter({ getPrisma: () => prisma as never, authMiddleware }));
  app.use(errorHandler);
  return app;
}

describe("forum routes (HTTP behavior with a fake database)", () => {
  it("rejects a bad post id", async () => {
    const res = await request(buildApp({})).get("/api/forum/post/abc");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid post id" });
  });

  it("returns 404 for a post that does not exist", async () => {
    const prisma = {
      forumPost: { update: vi.fn().mockRejectedValue(Object.assign(new Error("x"), { code: "P2025" })) },
    };
    const res = await request(buildApp(prisma)).get("/api/forum/post/99");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Post not found" });
  });

  it("returns 404 for an unknown category slug", async () => {
    const prisma = { forumCategory: { findUnique: vi.fn().mockResolvedValue(null) } };
    const res = await request(buildApp(prisma)).get("/api/forum/category/missing");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Category not found" });
  });

  it("requires categoryId, title and content when creating a post", async () => {
    const res = await request(buildApp({})).post("/api/forum/posts").send({ title: "Only a title" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "categoryId, title, and content are required" });
  });

  it("rejects over-long titles with the legacy message", async () => {
    const res = await request(buildApp({}))
      .post("/api/forum/posts")
      .send({ categoryId: 1, title: "x".repeat(201), content: "ok" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("200 characters or fewer");
  });

  it("creates a post with trimmed text and returns 201", async () => {
    const created = { id: 1, title: "Hello", content: "World" };
    const prisma = {
      forumCategory: { findUnique: vi.fn().mockResolvedValue({ id: 1 }) },
      forumPost: { create: vi.fn().mockResolvedValue(created) },
    };
    const res = await request(buildApp(prisma))
      .post("/api/forum/posts")
      .send({ categoryId: "1", title: "  Hello  ", content: " World " });
    expect(res.status).toBe(201);
    expect(prisma.forumPost.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { categoryId: 1, userId: "u1", title: "Hello", content: "World" } }),
    );
  });

  it("rejects replies to a locked post with 403", async () => {
    const prisma = { forumPost: { findUnique: vi.fn().mockResolvedValue({ id: 1, isLocked: true }) } };
    const res = await request(buildApp(prisma)).post("/api/forum/posts/1/replies").send({ content: "hi" });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "This post is locked" });
  });

  it("requires content for a reply", async () => {
    const res = await request(buildApp({})).post("/api/forum/posts/1/replies").send({ content: "   " });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Content is required" });
  });

  it("requires login to post or reply", async () => {
    const app = buildApp({}, deny);
    expect((await request(app).post("/api/forum/posts").send({})).status).toBe(401);
    expect((await request(app).post("/api/forum/posts/1/replies").send({})).status).toBe(401);
  });
});
