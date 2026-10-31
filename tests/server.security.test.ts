import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: typeof import("../app").app;

beforeAll(async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  ({ app } = await import("../app"));
});

describe("backend security boundaries", () => {
  it("serves the health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it.each([
    ["post", "/api/dinosaurs"],
    ["put", "/api/dinosaurs/1"],
    ["delete", "/api/dinosaurs/1"],
    ["post", "/api/subscription"],
    ["post", "/api/paypal/capture-order"],
    ["post", "/api/ai/chat"],
  ] as const)("requires authentication for %s %s", async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(401);
  });

  it("matches the recommendation route before the quiz id route", async () => {
    const response = await request(app).get("/api/quizzes/recommend");

    expect(response.status).toBe(401);
  });
});
