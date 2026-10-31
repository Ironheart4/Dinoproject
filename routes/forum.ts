import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter?: RequestHandler;
  aiLimiter?: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

export function createForumRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
router.get("/api/forum/categories", async (_req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { name: "asc" }
    });
    res.json(categories);
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get recent forum posts
router.get("/api/forum/posts/recent", async (_req, res) => {
  try {
    const posts = await prisma.forumPost.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { replies: true } }
      }
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch recent posts error:", error);
    res.status(500).json({ error: "Failed to fetch recent posts" });
  }
});

// Get posts by category
router.get("/api/forum/category/:slug", async (req, res) => {
  try {
    const category = await prisma.forumCategory.findUnique({
      where: { slug: req.params.slug },
      include: {
        posts: {
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          include: {
            user: { select: { id: true, name: true, role: true } },
            _count: { select: { replies: true } }
          }
        }
      }
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("Fetch category posts error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Get single post with replies
router.get("/api/forum/post/:id", async (req, res) => {
  try {
    const postId = parsePositiveInt(req.params.id);
    if (!postId) return res.status(400).json({ error: "Invalid post id" });

    // Increment view count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    });

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Fetch post error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create a new post (requires auth)
router.post("/api/forum/posts", deps.authMiddleware, async (req: any, res) => {
  try {
    const { categoryId, title, content } = req.body;
    const parsedCategoryId = parsePositiveInt(categoryId);
    if (!parsedCategoryId || typeof title !== "string" || typeof content !== "string" || !title.trim() || !content.trim()) {
      return res.status(400).json({ error: "categoryId, title, and content are required" });
    }
    if (title.trim().length > 200 || content.trim().length > 10000) {
      return res.status(400).json({ error: "Title must be 200 characters or fewer and content 10,000 characters or fewer" });
    }

    const post = await prisma.forumPost.create({
      data: {
        categoryId: parsedCategoryId,
        userId: req.user.id,
        title,
        content
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Create a reply (requires auth)
router.post("/api/forum/posts/:id/replies", deps.authMiddleware, async (req: any, res) => {
  try {
    const postId = parsePositiveInt(req.params.id);
    const { content } = req.body;
    if (!postId || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    if (content.trim().length > 10000) {
      return res.status(400).json({ error: "Content must be 10,000 characters or fewer" });
    }

    const reply = await prisma.forumReply.create({
      data: {
        postId,
        userId: req.user.id,
        content
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    // Update reply count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { replyCount: { increment: 1 } }
    });

    res.status(201).json(reply);
  } catch (error) {
    console.error("Create reply error:", error);
    res.status(500).json({ error: "Failed to create reply" });
  }
});


  return router;
}
