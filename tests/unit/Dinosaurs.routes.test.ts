import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";
import { createDinosaursRouter } from "../../modules/dinosaurs/Dinosaurs.routes";

const allow: RequestHandler = (_req, _res, next) => next();
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};

function buildApp(prisma: unknown, authMiddleware: RequestHandler = allow) {
  const app = express();
  app.use(express.json());
  app.use(
    createDinosaursRouter({
      getPrisma: () => prisma as never,
      authMiddleware,
      adminMiddleware: allow,
    }),
  );
  app.use(errorHandler);
  return app;
}

describe("dinosaurs routes (HTTP behavior with a fake database)", () => {
  it("rejects a bad id with 400 and the legacy message", async () => {
    const res = await request(buildApp({})).get("/api/dinosaurs/abc");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid dinosaur id" });
  });

  it("returns 404 for a missing dinosaur", async () => {
    const prisma = { dinosaur: { findUnique: vi.fn().mockResolvedValue(null) } };
    const res = await request(buildApp(prisma)).get("/api/dinosaurs/42");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Dinosaur not found" });
  });

  it("requires name and species on create", async () => {
    const res = await request(buildApp({})).post("/api/dinosaurs").send({ name: "Rex" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "'name' and 'species' are required" });
  });

  it("creates a dinosaur and returns 201", async () => {
    const created = { id: 1, name: "Rex", species: "T. rex" };
    const prisma = { dinosaur: { create: vi.fn().mockResolvedValue(created) } };
    const res = await request(buildApp(prisma)).post("/api/dinosaurs").send({ name: "Rex", species: "T. rex" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it("returns 409 when the species already exists", async () => {
    const prisma = {
      dinosaur: { create: vi.fn().mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" })) },
    };
    const res = await request(buildApp(prisma)).post("/api/dinosaurs").send({ name: "Rex", species: "T. rex" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "A dinosaur with this species already exists" });
  });

  it("deletes favorites together with the dinosaur in one transaction", async () => {
    const tx = {
      favorite: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      dinosaur: { delete: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)) };
    const res = await request(buildApp(prisma)).delete("/api/dinosaurs/3");
    expect(res.status).toBe(200);
    expect(tx.favorite.deleteMany).toHaveBeenCalledWith({ where: { dinoId: 3 } });
    expect(tx.dinosaur.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("returns 404 when updating a dinosaur that does not exist", async () => {
    const prisma = {
      dinosaur: { update: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "P2025" })) },
    };
    const res = await request(buildApp(prisma)).put("/api/dinosaurs/7").send({ name: "Rex", species: "T. rex" });
    expect(res.status).toBe(404);
  });

  it("blocks writes when the auth middleware denies", async () => {
    const app = buildApp({}, deny);
    expect((await request(app).post("/api/dinosaurs").send({ name: "a", species: "b" })).status).toBe(401);
    expect((await request(app).put("/api/dinosaurs/1").send({ name: "a", species: "b" })).status).toBe(401);
    expect((await request(app).delete("/api/dinosaurs/1")).status).toBe(401);
  });

  it("serves /featured before /:id", async () => {
    const prisma = { dinosaur: { findMany: vi.fn().mockResolvedValue([]) } };
    const res = await request(buildApp(prisma)).get("/api/dinosaurs/featured");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
