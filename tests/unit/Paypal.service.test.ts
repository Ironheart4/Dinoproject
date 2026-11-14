import { describe, expect, it, vi } from "vitest";
import { BadRequestError, NotFoundError } from "../../core/errors";
import type { PaymentProvider } from "../../infrastructure/payments/PaymentProvider";
import { resolvePlan } from "../../modules/paypal/Paypal.plans";
import type { PaypalRepository } from "../../modules/paypal/Paypal.repository";
import { PaypalService } from "../../modules/paypal/Paypal.service";

const amount = (value: string) => ({ toFixed: () => value });

function mockRepository(overrides: Partial<PaypalRepository> = {}): PaypalRepository {
  return {
    createOrder: vi.fn().mockResolvedValue({}),
    claimOrder: vi.fn().mockResolvedValue(null),
    releaseOrder: vi.fn().mockResolvedValue(undefined),
    completeOrder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as PaypalRepository;
}

function mockPayments(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    getClientId: vi.fn().mockReturnValue("client-123"),
    createCheckoutOrder: vi.fn().mockResolvedValue({ orderId: "ORD1", approvalUrl: "https://pp/approve" }),
    getOrder: vi.fn().mockResolvedValue({ ok: true, status: "APPROVED", currencyCode: "USD", amountValue: "3.00" }),
    captureOrder: vi.fn().mockResolvedValue({ ok: true, status: "COMPLETED", currencyCode: "USD", amountValue: "3.00" }),
    ...overrides,
  };
}

const urls = { frontendUrl: "https://app.example" };
const storedOrder = { id: "ORD1", userId: "u1", plan: "premium_monthly", amount: amount("3.00"), status: "processing" };

describe("resolvePlan", () => {
  it("prices the fixed plans and the donor plan", () => {
    expect(resolvePlan("premium_monthly")).toMatchObject({ amount: "3.00", subscriptionPlan: "premium", durationDays: 30 });
    expect(resolvePlan("premium_yearly")).toMatchObject({ amount: "24.00", durationDays: 365 });
    expect(resolvePlan("donor", 12.5)).toMatchObject({ amount: "12.50", subscriptionPlan: "donor", durationDays: 180 });
    expect(resolvePlan("donor").amount).toBe("5.00");
  });
});

describe("PaypalService.getClientId", () => {
  it("returns the client id or throws 503 when not configured", () => {
    expect(new PaypalService(mockRepository(), mockPayments(), urls).getClientId()).toEqual({ clientId: "client-123" });
    const missing = new PaypalService(mockRepository(), mockPayments({ getClientId: () => undefined }), urls);
    expect(() => missing.getClientId()).toThrow("PayPal not configured");
  });
});

describe("PaypalService.createOrder", () => {
  it("creates a PayPal order with the server-side price and stores it", async () => {
    const payments = mockPayments();
    const repository = mockRepository();
    const result = await new PaypalService(repository, payments, urls).createOrder("u1", {
      plan: "premium_yearly",
      donorAmount: undefined,
    });
    expect(payments.createCheckoutOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "24.00",
        returnUrl: "https://app.example/subscription/success",
        cancelUrl: "https://app.example/subscription",
      }),
    );
    expect(repository.createOrder).toHaveBeenCalledWith({ id: "ORD1", userId: "u1", plan: "premium_yearly", amount: "24.00" });
    expect(result).toEqual({ orderId: "ORD1", approvalUrl: "https://pp/approve" });
  });
});

describe("PaypalService.captureOrder", () => {
  it("returns 404 for an unknown, foreign or already processed order", async () => {
    const service = new PaypalService(mockRepository(), mockPayments(), urls);
    await expect(service.captureOrder("u1", "ORD1")).rejects.toThrow(NotFoundError);
  });

  it("captures, grants the plan from the stored order, and sets the expiry", async () => {
    const repository = mockRepository({ claimOrder: vi.fn().mockResolvedValue(storedOrder) });
    const service = new PaypalService(repository, mockPayments(), urls, () => Date.UTC(2026, 0, 1));
    const result = await service.captureOrder("u1", "ORD1");
    expect(result).toMatchObject({ success: true, plan: "premium" });
    expect(result.expiresAt.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(repository.completeOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "ORD1", userId: "u1", plan: "premium" }),
    );
    expect(repository.releaseOrder).not.toHaveBeenCalled();
  });

  it("rejects and releases the order when PayPal reports a different amount", async () => {
    const repository = mockRepository({ claimOrder: vi.fn().mockResolvedValue(storedOrder) });
    const payments = mockPayments({
      getOrder: vi.fn().mockResolvedValue({ ok: true, status: "APPROVED", currencyCode: "USD", amountValue: "1.00" }),
    });
    await expect(new PaypalService(repository, payments, urls).captureOrder("u1", "ORD1")).rejects.toThrow(
      BadRequestError,
    );
    expect(payments.captureOrder).not.toHaveBeenCalled();
    expect(repository.releaseOrder).toHaveBeenCalledWith("ORD1");
  });

  it("rejects an order that is not approved yet", async () => {
    const repository = mockRepository({ claimOrder: vi.fn().mockResolvedValue(storedOrder) });
    const payments = mockPayments({
      getOrder: vi.fn().mockResolvedValue({ ok: true, status: "CREATED", currencyCode: "USD", amountValue: "3.00" }),
    });
    await expect(new PaypalService(repository, payments, urls).captureOrder("u1", "ORD1")).rejects.toThrow(
      "do not match",
    );
  });

  it("releases the order when the capture is not completed", async () => {
    const repository = mockRepository({ claimOrder: vi.fn().mockResolvedValue(storedOrder) });
    const payments = mockPayments({
      captureOrder: vi.fn().mockResolvedValue({ ok: false, status: "FAILED", currencyCode: "", amountValue: "" }),
    });
    await expect(new PaypalService(repository, payments, urls).captureOrder("u1", "ORD1")).rejects.toThrow(
      "Payment not completed",
    );
    expect(repository.releaseOrder).toHaveBeenCalledWith("ORD1");
    expect(repository.completeOrder).not.toHaveBeenCalled();
  });

  it("keeps the order locked when money was captured but saving failed", async () => {
    const repository = mockRepository({
      claimOrder: vi.fn().mockResolvedValue(storedOrder),
      completeOrder: vi.fn().mockRejectedValue(new Error("db down")),
    });
    await expect(new PaypalService(repository, mockPayments(), urls).captureOrder("u1", "ORD1")).rejects.toThrow(
      "db down",
    );
    expect(repository.releaseOrder).not.toHaveBeenCalled();
  });

  it("grants a donor plan for 180 days", async () => {
    const donorOrder = { ...storedOrder, plan: "donor", amount: amount("10.00") };
    const repository = mockRepository({ claimOrder: vi.fn().mockResolvedValue(donorOrder) });
    const payments = mockPayments({
      getOrder: vi.fn().mockResolvedValue({ ok: true, status: "APPROVED", currencyCode: "USD", amountValue: "10.00" }),
      captureOrder: vi.fn().mockResolvedValue({ ok: true, status: "COMPLETED", currencyCode: "USD", amountValue: "10.00" }),
    });
    const result = await new PaypalService(repository, payments, urls, () => 0).captureOrder("u1", "ORD1");
    expect(result.plan).toBe("donor");
    expect(result.expiresAt.getTime()).toBe(180 * 24 * 60 * 60 * 1000);
  });
});
