import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";
import { createAiRouter } from "../../modules/ai/Ai.routes";

const asUser = (role: string): RequestHandler => (req, _res, next) => {
  (req as unknown as { user: unknown }).user = { id: "u1", role, name: null };
  next();
};
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};
const passLimiter: RequestHandler = (_req, _res, next) => next();

function buildApp(opts: { prisma?: unknown; auth?: RequestHandler; limiter?: RequestHandler; generate?: ReturnType<typeof vi.fn> }) {
  const app = express();
  app.use(express.json());
  app.use(
    createAiRouter({
      getPrisma: () => (opts.prisma ?? {}) as never,
      authMiddleware: opts.auth ?? asUser("admin"),
      aiLimiter: opts.limiter ?? passLimiter,
      aiProvider: { generate: opts.generate ?? vi.fn().mockResolvedValue({ kind: "ok", response: "answer" }) },
    }),
  );
  app.use(errorHandler);
  return app;
}

describe("ai routes (HTTP behavior with a fake provider and database)", () => {
  it("requires login", async () => {
    const res = await request(buildApp({ auth: deny })).post("/api/ai/chat").send({ message: "hi" });
    expect(res.status).toBe(401);
  });

  it("runs the rate limiter before authentication", async () => {
    const limiter: RequestHandler = (_req, res) => {
      res.status(429).json({ error: "Too many AI requests, please try again later." });
    };
    const res = await request(buildApp({ limiter, auth: deny })).post("/api/ai/chat").send({ message: "hi" });
    expect(res.status).toBe(429);
  });

  it("validates the message", async () => {
    const app = buildApp({});
    const empty = await request(app).post("/api/ai/chat").send({ message: "  " });
    expect(empty.status).toBe(400);
    expect(empty.body).toEqual({ error: "Message is required" });

    const long = await request(app).post("/api/ai/chat").send({ message: "x".repeat(2001) });
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: "Message must be 2,000 characters or fewer" });
  });

  it("returns 403 with the legacy body for free users", async () => {
    const prisma = { subscription: { findUnique: vi.fn().mockResolvedValue(null) } };
    const res = await request(buildApp({ prisma, auth: asUser("user") })).post("/api/ai/chat").send({ message: "hi" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Premium required");
    expect(res.body.message).toContain("Premium and Donor");
  });

  it("answers an admin's question", async () => {
    const res = await request(buildApp({})).post("/api/ai/chat").send({ message: "hi" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ response: "answer" });
  });

  it("answers an active premium member and returns 503 while the model loads", async () => {
    const future = new Date(Date.now() + 86_400_000);
    const prisma = { subscription: { findUnique: vi.fn().mockResolvedValue({ plan: "premium", status: "active", endDate: future }) } };
    const ok = await request(buildApp({ prisma, auth: asUser("user") })).post("/api/ai/chat").send({ message: "hi" });
    expect(ok.status).toBe(200);

    const generate = vi.fn().mockResolvedValue({ kind: "loading", response: "", estimatedTime: 20 });
    const loading = await request(buildApp({ prisma, auth: asUser("user"), generate })).post("/api/ai/chat").send({ message: "hi" });
    expect(loading.status).toBe(503);
    expect(loading.body).toMatchObject({ error: "Model loading", estimatedTime: 20 });
  });
});
