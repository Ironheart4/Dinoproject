import { describe, expect, it } from "vitest";
import { ROUTE_CONTRACT, contractKey, protectedRoutes } from "./contracts/route-contract";

/**
 * Auth boundary HTTP checks live in `route-contract.test.ts`.
 * This file keeps a lightweight sanity check that the Phase 1 contract
 * still covers the original security-sensitive routes.
 */
describe("backend security contract coverage", () => {
  it("includes the original auth-gated mutation routes", () => {
    const keys = new Set(
      protectedRoutes().map((entry) => contractKey(entry.method, entry.path)),
    );

    for (const key of [
      "post /api/dinosaurs",
      "put /api/dinosaurs/:id",
      "delete /api/dinosaurs/:id",
      "post /api/subscription",
      "post /api/paypal/capture-order",
      "post /api/ai/chat",
      "get /api/quizzes/recommend",
    ]) {
      expect(keys.has(key), `missing from contract: ${key}`).toBe(true);
    }
  });

  it("keeps health as a public route in the contract", () => {
    expect(
      ROUTE_CONTRACT.some(
        (entry) => entry.method === "get" && entry.path === "/health" && entry.auth === "public",
      ),
    ).toBe(true);
  });
});
