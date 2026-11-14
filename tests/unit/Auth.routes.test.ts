import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { BadRequestError, UnauthorizedError } from "../../core/errors";
import type { AuthProvider } from "../../infrastructure/auth/AuthProvider";
import { createAuthMiddleware } from "../../middleware/auth";
import { errorHandler } from "../../middleware/errorHandler";
import { createAuthRouter } from "../../modules/auth/Auth.routes";

const pass: RequestHandler = (_req, _res, next) => next();

function provider(overrides: Partial<AuthProvider> = {}): AuthProvider {
  return {
    signUp: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b.c" }),
    signIn: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b.c", nameFromMetadata: "Ayo", accessToken: "at", refreshToken: "rt" }),
    signOut: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue({ accessToken: "at2", refreshToken: "rt2" }),
    getUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c", name: "Ayo" }),
    ...overrides,
  };
}

function buildApp(prisma: unknown, authProvider: AuthProvider = provider(), authLimiter: RequestHandler = pass) {
  const getPrisma = () => prisma as never;
  const app = express();
  app.use(express.json());
  const users = { findOrCreateUser: vi.fn() };
  void users;
  app.use(
    createAuthRouter({
      getPrisma,
      authProvider,
      authLimiter,
      authMiddleware: createAuthMiddleware(authProvider, {
        findOrCreateUser: async (data) => ({ ...data, createdAt: new Date(), bio: null, profilePic: null }) as never,
      }),
    }),
  );
  app.use(errorHandler);
  return app;
}

describe("auth routes: validation (legacy messages)", () => {
  const app = buildApp({});

  it("register requires name, email and password", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.c" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name, email, password required" });
  });

  it("register checks password length, then email format", async () => {
    const short = await request(app).post("/api/auth/register").send({ name: "A", email: "a@b.c", password: "123" });
    expect(short.body).toEqual({ error: "Password must be at least 6 characters" });
    const badEmail = await request(app).post("/api/auth/register").send({ name: "A", email: "nope", password: "secret1" });
    expect(badEmail.body).toEqual({ error: "Invalid email format" });
  });

  it("register rejects non-string input instead of crashing", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: 1, email: {}, password: [] });
    expect(res.status).toBe(400);
  });

  it("login and refresh require their fields", async () => {
    expect((await request(app).post("/api/auth/login").send({ email: "a@b.c" })).body).toEqual({
      error: "email and password required",
    });
    expect((await request(app).post("/api/auth/refresh").send({})).body).toEqual({
      error: "Refresh token required",
    });
  });

  it("works without a JSON body (no crash)", async () => {
    const res = await request(app).post("/api/auth/login");
    expect(res.status).toBe(400);
  });
});

describe("auth routes: flows", () => {
  it("registers a user and returns 201", async () => {
    const prisma = { user: { create: vi.fn().mockImplementation(async ({ data }) => data) } };
    const res = await request(buildApp(prisma)).post("/api/auth/register").send({ name: "Ayo", email: "a@b.c", password: "secret1" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "u1", name: "Ayo", email: "a@b.c" });
  });

  it("returns 400 when the profile row already exists", async () => {
    const prisma = { user: { create: vi.fn().mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" })) } };
    const res = await request(buildApp(prisma)).post("/api/auth/register").send({ name: "Ayo", email: "a@b.c", password: "secret1" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User already exists" });
  });

  it("surfaces provider errors with their status", async () => {
    const up = provider({ signUp: vi.fn().mockRejectedValue(new BadRequestError("User already registered")) });
    const res = await request(buildApp({}, up)).post("/api/auth/register").send({ name: "A", email: "a@b.c", password: "secret1" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "User already registered" });

    const bad = provider({ signIn: vi.fn().mockRejectedValue(new UnauthorizedError("Invalid credentials")) });
    const login = await request(buildApp({}, bad)).post("/api/auth/login").send({ email: "a@b.c", password: "x" });
    expect(login.status).toBe(401);
    expect(login.body).toEqual({ error: "Invalid credentials" });
  });

  it("logs in and returns tokens and the user", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: "u1", name: "Ayo", role: "user" }) },
    };
    const res = await request(buildApp(prisma)).post("/api/auth/login").send({ email: "a@b.c", password: "x" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: "at",
      refreshToken: "rt",
      user: { id: "u1", name: "Ayo", email: "a@b.c", role: "user" },
    });
  });

  it("refreshes a session and logs out", async () => {
    const app = buildApp({});
    expect((await request(app).post("/api/auth/refresh").send({ refreshToken: "rt" })).body).toEqual({
      token: "at2",
      refreshToken: "rt2",
    });
    const out = await request(app).post("/api/auth/logout").set("Authorization", "Bearer tok");
    expect(out.body).toEqual({ message: "Logged out successfully" });
  });

  it("applies the auth rate limiter to register and login", async () => {
    const limited: RequestHandler = (_req, res) => {
      res.status(429).json({ error: "Too many authentication attempts, please try again later." });
    };
    const app = buildApp({}, provider(), limited);
    expect((await request(app).post("/api/auth/register").send({})).status).toBe(429);
    expect((await request(app).post("/api/auth/login").send({})).status).toBe(429);
  });
});

describe("auth middleware via GET /api/auth/me", () => {
  it("rejects a missing or invalid token", async () => {
    expect((await request(buildApp({})).get("/api/auth/me")).body).toEqual({ error: "No token provided" });

    const none = provider({ getUser: vi.fn().mockResolvedValue(null) });
    const res = await request(buildApp({}, none)).get("/api/auth/me").set("Authorization", "Bearer bad");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid token" });

    const boom = provider({ getUser: vi.fn().mockRejectedValue(new Error("network")) });
    const err = await request(buildApp({}, boom)).get("/api/auth/me").set("Authorization", "Bearer x");
    expect(err.status).toBe(401);
  });

  it("returns the profile for a valid token and 404 if the row is missing", async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "u1", name: "Ayo", role: "admin", createdAt: new Date("2026-01-01"), subscription: null,
        }),
      },
    };
    const res = await request(buildApp(prisma)).get("/api/auth/me").set("Authorization", "Bearer good");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "u1", role: "admin", email: "a@b.c", subscription: null });

    const missing = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const nf = await request(buildApp(missing)).get("/api/auth/me").set("Authorization", "Bearer good");
    expect(nf.status).toBe(404);
  });

  it("returns 503 when the profile lookup fails", async () => {
    const failing = createAuthMiddleware(provider(), { findOrCreateUser: vi.fn().mockRejectedValue(new Error("db")) });
    const app = express();
    app.get("/x", failing, (_req, res) => {
      res.json({ ok: true });
    });
    const res = await request(app).get("/x").set("Authorization", "Bearer good");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "User profile service unavailable" });
  });
});
