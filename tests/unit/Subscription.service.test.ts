import { describe, expect, it, vi } from "vitest";
import type { SubscriptionRepository } from "../../modules/subscription/Subscription.repository";
import { SubscriptionService } from "../../modules/subscription/Subscription.service";

const baseSubscription = {
  id: 1,
  userId: "u1",
  plan: "premium",
  status: "active",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-02-01"),
  paypalSubscriptionId: null,
  paypalOrderId: null,
  createdAt: new Date("2024-01-01"),
};

function mockRepository(
  overrides: Partial<SubscriptionRepository> = {},
): SubscriptionRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn().mockResolvedValue(baseSubscription),
    upsertActive: vi.fn().mockResolvedValue(baseSubscription),
    ...overrides,
  } as SubscriptionRepository;
}

describe("SubscriptionService", () => {
  it("getForUser returns free/active when no subscription exists", async () => {
    const service = new SubscriptionService(mockRepository());
    await expect(service.getForUser("u1")).resolves.toEqual({
      plan: "free",
      status: "active",
    });
  });

  it("getForUser marks expired donor and updates status when needed", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const donor = {
      ...baseSubscription,
      plan: "donor",
      status: "active",
      endDate: past,
    };
    const updateStatus = vi.fn().mockResolvedValue({ ...donor, status: "expired" });
    const service = new SubscriptionService(
      mockRepository({
        findByUserId: vi.fn().mockResolvedValue(donor),
        updateStatus,
      }),
    );

    await expect(service.getForUser("u1")).resolves.toEqual({
      ...donor,
      status: "expired",
      donorExpired: true,
    });
    expect(updateStatus).toHaveBeenCalledWith("u1", "expired");
  });

  it("getForUser does not update when donor already expired", async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const donor = {
      ...baseSubscription,
      plan: "donor",
      status: "expired",
      endDate: past,
    };
    const updateStatus = vi.fn();
    const service = new SubscriptionService(
      mockRepository({
        findByUserId: vi.fn().mockResolvedValue(donor),
        updateStatus,
      }),
    );

    await expect(service.getForUser("u1")).resolves.toEqual({
      ...donor,
      status: "expired",
      donorExpired: true,
    });
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it("upsertForUser sets premium endDate one month ahead", async () => {
    const upsertActive = vi.fn().mockResolvedValue(baseSubscription);
    const service = new SubscriptionService(mockRepository({ upsertActive }));
    const before = Date.now();

    await service.upsertForUser("u1", "premium", "pp-1");

    expect(upsertActive).toHaveBeenCalledOnce();
    const arg = upsertActive.mock.calls[0][0];
    expect(arg.userId).toBe("u1");
    expect(arg.plan).toBe("premium");
    expect(arg.paypalSubscriptionId).toBe("pp-1");
    const expectedMin = new Date(before);
    expectedMin.setMonth(expectedMin.getMonth() + 1);
    expect(arg.endDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
  });

  it("cancelForUser updates status and returns success", async () => {
    const updateStatus = vi.fn().mockResolvedValue(baseSubscription);
    const service = new SubscriptionService(mockRepository({ updateStatus }));

    await expect(service.cancelForUser("u1")).resolves.toEqual({ success: true });
    expect(updateStatus).toHaveBeenCalledWith("u1", "cancelled");
  });
});
