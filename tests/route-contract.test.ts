import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  NO_TOKEN_RESPONSE,
  ORDERING_NOTES,
  ROUTE_CONTRACT,
  contractKey,
  protectedRoutes,
  publicRoutes,
  samplePathFor,
} from "./contracts/route-contract";
import { listExpressRoutes, listedRouteKeys } from "./helpers/listExpressRoutes";

let app: typeof import("../app").app;

beforeAll(async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
  ({ app } = await import("../app"));
});

describe("route contract snapshot", () => {
  it("records a unique method+path for every entry", () => {
    const keys = ROUTE_CONTRACT.map((entry) => contractKey(entry.method, entry.path));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("registers every contracted route on the live Express app", () => {
    const registered = listedRouteKeys(listExpressRoutes(app));
    const missing = ROUTE_CONTRACT
      .map((entry) => contractKey(entry.method, entry.path))
      .filter((key) => !registered.has(key));

    expect(missing, `Missing routes: ${missing.join(", ")}`).toEqual([]);
  });

  it("does not expose uncontracted HTTP routes", () => {
    const contracted = new Set(
      ROUTE_CONTRACT.map((entry) => contractKey(entry.method, entry.path)),
    );
    const extras = [...listedRouteKeys(listExpressRoutes(app))]
      .filter((key) => !contracted.has(key))
      .sort();

    expect(extras, `Uncontracted routes: ${extras.join(", ")}`).toEqual([]);
  });

  it("documents mount-order invariants used by the migration", () => {
    expect(ORDERING_NOTES.length).toBeGreaterThan(0);
    expect(ORDERING_NOTES.some((note) => note.includes("/api/quizzes/recommend"))).toBe(true);
  });
});

describe("unauthenticated auth boundaries", () => {
  it.each(
    protectedRoutes().map((entry) => [
      entry.method,
      samplePathFor(entry),
      entry.auth,
      entry.path,
    ] as const),
  )("%s %s (%s for %s) returns 401 without a token", async (method, samplePath) => {
    const response = await request(app)[method](samplePath);
    expect(response.status).toBe(401);
    expect(response.body).toEqual(NO_TOKEN_RESPONSE);
  });

  it.each(
    publicRoutes().map((entry) => [
      entry.method,
      samplePathFor(entry),
      entry.path,
    ] as const),
  )("%s %s does not require a bearer token", async (method, samplePath) => {
    const response = await request(app)[method](samplePath);
    expect(response.status).not.toBe(401);
    expect(response.body).not.toEqual(NO_TOKEN_RESPONSE);
  });
});

describe("stable public response shapes (no database)", () => {
  it("GET / returns the ready message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "🦖 DinoProject Backend — READY TO ROAR! 🔥",
    });
  });

  it("GET /health returns ok + timestamp", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(typeof response.body.timestamp).toBe("string");
  });

  it("GET /health/db returns 503 when prisma is not wired", async () => {
    const response = await request(app).get("/health/db");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      detail: "Database unavailable",
    });
  });

  it("GET /api/paypal/client-id returns clientId or a not-configured error", async () => {
    // Do not assert on env contents; both local shapes are part of the live contract.
    const response = await request(app).get("/api/paypal/client-id");
    if (response.status === 200) {
      expect(typeof response.body.clientId).toBe("string");
      expect(response.body.clientId.length).toBeGreaterThan(0);
    } else {
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ error: "PayPal not configured" });
    }
  });

  it("GET /api/search with a short query returns empty results without auth", async () => {
    const response = await request(app).get("/api/search").query({ q: "a" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: { dinosaurs: [], quizzes: [] },
    });
  });
});

describe("ordering-sensitive routes", () => {
  it("GET /api/quizzes/recommend hits auth (not the :id handler as 404/public)", async () => {
    const response = await request(app).get("/api/quizzes/recommend");
    expect(response.status).toBe(401);
    expect(response.body).toEqual(NO_TOKEN_RESPONSE);
  });

  it("GET /api/favorites/check/:dinoId hits auth before the delete param route", async () => {
    const response = await request(app).get("/api/favorites/check/1");
    expect(response.status).toBe(401);
    expect(response.body).toEqual(NO_TOKEN_RESPONSE);
  });
});
