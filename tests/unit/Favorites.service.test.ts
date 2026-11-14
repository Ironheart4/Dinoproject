import { describe, expect, it, vi } from "vitest";
import type { Favorite, Subscription } from "@prisma/client";
import { ForbiddenError } from "../../core/errors";
import type { FavoritesRepository } from "../../modules/favorites/Favorites.repository";
import {
  FavoritesService,
  isPremiumOrActiveDonor,
} from "../../modules/favorites/Favorites.service";

function favorite(overrides: Partial<Favorite> = {}): Favorite {
  return {
    id: 1,
    userId: "user-1",
    dinoId: 10,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 1,
    userId: "user-1",
    plan: "free",
    status: "active",
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: null,
    paypalSubscriptionId: null,
    paypalOrderId: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function mockRepository(
  partial: Partial<FavoritesRepository>,
): FavoritesRepository {
  return partial as FavoritesRepository;
}

describe("isPremiumOrActiveDonor", () => {
  it("returns false for null subscription", () => {
    expect(isPremiumOrActiveDonor(null)).toBe(false);
  });

  it("returns true for active premium", () => {
    expect(
      isPremiumOrActiveDonor(subscription({ plan: "premium", status: "active" })),
    ).toBe(true);
  });

  it("returns true for active donor within endDate", () => {
    const endDate = new Date(Date.now() + 86_400_000);
    expect(
      isPremiumOrActiveDonor(
        subscription({ plan: "donor", status: "active", endDate }),
      ),
    ).toBe(true);
  });

  it("returns false for donor with past endDate", () => {
    const endDate = new Date(Date.now() - 86_400_000);
    expect(
      isPremiumOrActiveDonor(
        subscription({ plan: "donor", status: "active", endDate }),
      ),
    ).toBe(false);
  });

  it("returns false for inactive premium", () => {
    expect(
      isPremiumOrActiveDonor(
        subscription({ plan: "premium", status: "cancelled" }),
      ),
    ).toBe(false);
  });
});

describe("FavoritesService", () => {
  it("listFavorites delegates to the repository", async () => {
    const rows = [{ ...favorite(), dinosaur: { id: 10 } }];
    const findManyByUserId = vi.fn().mockResolvedValue(rows);
    const service = new FavoritesService(mockRepository({ findManyByUserId }));

    await expect(service.listFavorites("user-1")).resolves.toEqual(rows);
    expect(findManyByUserId).toHaveBeenCalledWith("user-1");
  });

  it("checkFavorite returns isFavorited true when a row exists", async () => {
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(favorite()),
      }),
    );
    await expect(service.checkFavorite("user-1", 10)).resolves.toEqual({
      isFavorited: true,
    });
  });

  it("checkFavorite returns isFavorited false when missing", async () => {
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(null),
      }),
    );
    await expect(service.checkFavorite("user-1", 10)).resolves.toEqual({
      isFavorited: false,
    });
  });

  it("addFavorite returns existing favorite without creating", async () => {
    const existing = favorite();
    const create = vi.fn();
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(existing),
        create,
      }),
    );

    await expect(service.addFavorite("user-1", 10)).resolves.toEqual({
      created: false,
      favorite: existing,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("addFavorite creates when under free limit", async () => {
    const created = favorite({ id: 2 });
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(null),
        findSubscriptionByUserId: vi.fn().mockResolvedValue(null),
        countByUserId: vi.fn().mockResolvedValue(4),
        create: vi.fn().mockResolvedValue(created),
      }),
    );

    await expect(service.addFavorite("user-1", 10)).resolves.toEqual({
      created: true,
      favorite: created,
    });
  });

  it("addFavorite throws ForbiddenError at free limit", async () => {
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(null),
        findSubscriptionByUserId: vi.fn().mockResolvedValue(
          subscription({ plan: "free" }),
        ),
        countByUserId: vi.fn().mockResolvedValue(5),
        create: vi.fn(),
      }),
    );

    await expect(service.addFavorite("user-1", 10)).rejects.toMatchObject({
      name: "ForbiddenError",
      statusCode: 403,
      message:
        "Free users can only save up to 5 favorites. Upgrade to unlock unlimited favorites!",
      body: {
        error:
          "Free users can only save up to 5 favorites. Upgrade to unlock unlimited favorites!",
        limitReached: true,
      },
    });
  });

  it("addFavorite skips limit for active premium", async () => {
    const created = favorite({ id: 3 });
    const countByUserId = vi.fn();
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(null),
        findSubscriptionByUserId: vi.fn().mockResolvedValue(
          subscription({ plan: "premium", status: "active" }),
        ),
        countByUserId,
        create: vi.fn().mockResolvedValue(created),
      }),
    );

    await expect(service.addFavorite("user-1", 10)).resolves.toEqual({
      created: true,
      favorite: created,
    });
    expect(countByUserId).not.toHaveBeenCalled();
  });

  it("addFavorite enforces limit for expired donor", async () => {
    const service = new FavoritesService(
      mockRepository({
        findByUserAndDino: vi.fn().mockResolvedValue(null),
        findSubscriptionByUserId: vi.fn().mockResolvedValue(
          subscription({
            plan: "donor",
            status: "active",
            endDate: new Date(Date.now() - 86_400_000),
          }),
        ),
        countByUserId: vi.fn().mockResolvedValue(5),
        create: vi.fn(),
      }),
    );

    await expect(service.addFavorite("user-1", 10)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("removeFavorite deletes and returns success", async () => {
    const deleteByUserAndDino = vi.fn().mockResolvedValue(undefined);
    const service = new FavoritesService(
      mockRepository({ deleteByUserAndDino }),
    );

    await expect(service.removeFavorite("user-1", 10)).resolves.toEqual({
      success: true,
    });
    expect(deleteByUserAndDino).toHaveBeenCalledWith("user-1", 10);
  });
});
