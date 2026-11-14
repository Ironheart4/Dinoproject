import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { profileUpload } from "../../infrastructure/storage/profileUpload";
import { errorHandler } from "../../middleware/errorHandler";
import { createProfileRouter } from "../../modules/profile/Profile.routes";

const allow: RequestHandler = (req, _res, next) => {
  (req as unknown as { user: unknown }).user = { id: "u1", role: "user", name: null, email: "a@b.c" };
  next();
};
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};

const storage = {
  uploadPublicImage: vi.fn().mockResolvedValue("https://x/storage/v1/object/public/pics/u1/p.png"),
  removeObject: vi.fn().mockResolvedValue(undefined),
  publicUrlToObjectPath: vi.fn().mockReturnValue(null),
};

function buildApp(prisma: unknown, authMiddleware: RequestHandler = allow) {
  const app = express();
  app.use(express.json());
  app.use(
    createProfileRouter({
      getPrisma: () => prisma as never,
      authMiddleware,
      upload: profileUpload,
      storageProvider: storage,
    }),
  );
  app.use(errorHandler);
  return app;
}

describe("profile routes (HTTP behavior with a fake database)", () => {
  it("requires login on every route", async () => {
    const app = buildApp({}, deny);
    expect((await request(app).get("/api/user/me")).status).toBe(401);
    expect((await request(app).put("/api/user/profile").send({})).status).toBe(401);
    expect((await request(app).post("/api/user/profile-pic")).status).toBe(401);
    expect((await request(app).delete("/api/user/profile-pic")).status).toBe(401);
  });

  it("returns 404 when the user row is missing", async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const res = await request(buildApp(prisma)).get("/api/user/me");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("rejects a name longer than 100 characters", async () => {
    const res = await request(buildApp({})).put("/api/user/profile").send({ name: "x".repeat(101) });
    expect(res.status).toBe(400);
  });

  it("updates the profile and returns the legacy shape", async () => {
    const prisma = {
      user: { update: vi.fn().mockResolvedValue({ id: "u1", name: "Ayo", bio: "hi", profilePic: null }) },
    };
    const res = await request(buildApp(prisma)).put("/api/user/profile").send({ name: "Ayo", bio: "hi" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "u1", name: "Ayo", email: "a@b.c", bio: "hi", profilePic: null });
  });

  it("returns 400 when no file is uploaded", async () => {
    const res = await request(buildApp({})).post("/api/user/profile-pic");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No file uploaded" });
  });

  it("returns 400 (not 500) for a non-image upload", async () => {
    const res = await request(buildApp({}))
      .post("/api/user/profile-pic")
      .attach("profilePic", Buffer.from("not an image"), { filename: "a.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Only image files allowed");
  });

  it("returns 400 for a file over 5 MB", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1);
    const res = await request(buildApp({}))
      .post("/api/user/profile-pic")
      .attach("profilePic", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "File too large (max 5 MB)" });
  });

  it("uploads an image and saves the public URL", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ profilePic: null }),
        update: vi.fn().mockResolvedValue({ profilePic: "https://x/storage/v1/object/public/pics/u1/p.png" }),
      },
    };
    const res = await request(buildApp(prisma))
      .post("/api/user/profile-pic")
      .attach("profilePic", Buffer.from("png-bytes"), { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile picture updated successfully");
  });
});
