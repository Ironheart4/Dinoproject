import { describe, expect, it, vi } from "vitest";
import { BadRequestError } from "../../core/errors";
import type { UsersRepository } from "../../modules/users/Users.repository";
import { UsersService } from "../../modules/users/Users.service";

function mockRepository(
  overrides: Partial<UsersRepository> = {},
): UsersRepository {
  return {
    findManyWithSubscription: vi.fn().mockResolvedValue([]),
    countAdmins: vi.fn().mockResolvedValue(2),
    findRoleById: vi.fn().mockResolvedValue({ role: "user" }),
    updateRole: vi.fn().mockResolvedValue({ id: "u1", name: "A", role: "admin" }),
    ...overrides,
  } as UsersRepository;
}

describe("UsersService", () => {
  it("listUsers maps missing subscription to free/active defaults", async () => {
    const service = new UsersService(
      mockRepository({
        findManyWithSubscription: vi.fn().mockResolvedValue([
          {
            id: "u1",
            name: "Ada",
            role: "user",
            createdAt: new Date("2024-01-01"),
            subscription: null,
          },
          {
            id: "u2",
            name: "Bob",
            role: "admin",
            createdAt: new Date("2024-01-02"),
            subscription: { plan: "premium", status: "active" },
          },
        ]),
      }),
    );

    await expect(service.listUsers()).resolves.toEqual([
      {
        id: "u1",
        name: "Ada",
        role: "user",
        createdAt: new Date("2024-01-01"),
        subscription: null,
        subscriptionTier: "free",
        subscriptionStatus: "active",
      },
      {
        id: "u2",
        name: "Bob",
        role: "admin",
        createdAt: new Date("2024-01-02"),
        subscription: { plan: "premium", status: "active" },
        subscriptionTier: "premium",
        subscriptionStatus: "active",
      },
    ]);
  });

  it("updateRole rejects self-demotion", async () => {
    const updateRole = vi.fn();
    const service = new UsersService(mockRepository({ updateRole }));

    await expect(service.updateRole("me", "user", "me")).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(service.updateRole("me", "user", "me")).rejects.toMatchObject({
      message: "You cannot demote yourself",
    });
    expect(updateRole).not.toHaveBeenCalled();
  });

  it("updateRole rejects demoting the last admin", async () => {
    const updateRole = vi.fn();
    const service = new UsersService(
      mockRepository({
        countAdmins: vi.fn().mockResolvedValue(1),
        findRoleById: vi.fn().mockResolvedValue({ role: "admin" }),
        updateRole,
      }),
    );

    await expect(
      service.updateRole("other", "user", "me"),
    ).rejects.toMatchObject({
      message: "The last admin cannot be demoted",
    });
    expect(updateRole).not.toHaveBeenCalled();
  });

  it("updateRole promotes a user to admin", async () => {
    const updateRole = vi.fn().mockResolvedValue({
      id: "u1",
      name: "Ada",
      role: "admin",
    });
    const service = new UsersService(mockRepository({ updateRole }));

    await expect(service.updateRole("u1", "admin", "me")).resolves.toEqual({
      id: "u1",
      name: "Ada",
      role: "admin",
    });
    expect(updateRole).toHaveBeenCalledWith("u1", "admin");
  });
});
