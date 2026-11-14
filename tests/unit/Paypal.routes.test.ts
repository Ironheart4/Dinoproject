import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { PaymentProvider } from "../../infrastructure/payments/PaymentProvider";
import { errorHandler } from "../../middleware/errorHandler";
import { createPaypalRouter } from "../../modules/paypal/Paypal.routes";

const allow: RequestHandler = (req, _res, next) => {
  (req as unknown as { user: unknown }).user = { id: "u1", role: "user", name: null };
  next();
};
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};

const payments: PaymentProvider = {
  isConfigured: () => true,
  getClientId: () => "client-123",
  createCheckoutOrder: vi.fn().mockResolvedValue({ orderId: "ORD1", approvalUrl: "https://pp/approve" }),
  getOrder: vi.fn(),
  captureOrder: vi.fn(),
};

function buildApp(prisma: unknown, authMiddleware: RequestHandler = allow, provider: PaymentProvider = payments) {
  const app = express();
  app.use(express.json());
  app.use(
    createPaypalRouter({
      getPrisma: () => prisma as never,
      authMiddleware,
      paymentProvider: provider,
      frontendUrl: "https://app.example",
    }),
  );
  app.use(errorHandler);
  return app;
}

describe("paypal routes (HTTP behavior with a fake provider and database)", () => {
  it("requires login to create and capture orders", async () => {
    const app = buildApp({}, deny);
    expect((await request(app).post("/api/paypal/create-order").send({ plan: "donor" })).status).toBe(401);
    expect((await request(app).post("/api/paypal/capture-order").send({ orderId: "x" })).status).toBe(401);
  });

  it("rejects an unknown plan", async () => {
    const res = await request(buildApp({})).post("/api/paypal/create-order").send({ plan: "gold" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid plan" });
  });

  it("rejects a donor amount outside 5 to 10000", async () => {
    const app = buildApp({});
    for (const amount of [4.99, 10001, "abc"]) {
      const res = await request(app).post("/api/paypal/create-order").send({ plan: "donor", amount });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Donor amount");
    }
  });

  it("creates a monthly order priced on the server", async () => {
    const prisma = { payPalOrder: { create: vi.fn().mockResolvedValue({}) } };
    const res = await request(buildApp(prisma))
      .post("/api/paypal/create-order")
      .send({ plan: "premium_monthly", amount: "0.01" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ orderId: "ORD1", approvalUrl: "https://pp/approve" });
    expect(payments.createCheckoutOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: "3.00" }));
  });

  it("requires an orderId to capture", async () => {
    const res = await request(buildApp({})).post("/api/paypal/capture-order").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Valid orderId required" });
  });

  it("returns 404 when the order is unknown or already processed", async () => {
    const prisma = { payPalOrder: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    const res = await request(buildApp(prisma)).post("/api/paypal/capture-order").send({ orderId: "ORD9" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "PayPal order not found or already processed" });
  });

  it("serves the public client id, or 503 when PayPal is not configured", async () => {
    const ok = await request(buildApp({})).get("/api/paypal/client-id");
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ clientId: "client-123" });

    const missing = await request(buildApp({}, allow, { ...payments, getClientId: () => undefined })).get(
      "/api/paypal/client-id",
    );
    expect(missing.status).toBe(503);
    expect(missing.body).toEqual({ error: "PayPal not configured" });
  });
});
