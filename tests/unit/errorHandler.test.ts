import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../core/errors";
import { errorHandler } from "../../middleware/errorHandler";

function buildApp(thrower: (req: express.Request, res: express.Response) => void) {
  const app = express();
  app.get("/boom", (req, res, next) => {
    try {
      thrower(req, res);
    } catch (error) {
      next(error);
    }
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler AppError mapping", () => {
  it("returns AppError status and body for BadRequestError", async () => {
    const app = buildApp(() => {
      throw new BadRequestError("Invalid request", { details: ["name"] });
    });
    const response = await request(app).get("/boom");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid request", details: ["name"] });
  });

  it("returns AppError status and body for UnauthorizedError", async () => {
    const app = buildApp(() => {
      throw new UnauthorizedError("Invalid token");
    });
    const response = await request(app).get("/boom");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid token" });
  });

  it("returns AppError status and body for NotFoundError", async () => {
    const app = buildApp(() => {
      throw new NotFoundError("Dinosaur not found");
    });
    const response = await request(app).get("/boom");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Dinosaur not found" });
  });

  it("keeps opaque 500 for unknown errors", async () => {
    const app = buildApp(() => {
      throw new Error("secret internals");
    });
    const response = await request(app).get("/boom");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});
