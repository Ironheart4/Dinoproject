import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { HealthRepository } from "../../modules/health/Health.repository";

describe("HealthRepository", () => {
  it("returns unavailable when prisma is missing", async () => {
    const repository = new HealthRepository(() => undefined);
    await expect(repository.pingDatabase()).resolves.toEqual({ kind: "unavailable" });
  });

  it("returns ok when SELECT 1 succeeds", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    } as unknown as PrismaClient;
    const repository = new HealthRepository(() => prisma);
    await expect(repository.pingDatabase()).resolves.toEqual({ kind: "ok" });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns error detail when the query throws", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("connection refused")),
    } as unknown as PrismaClient;
    const repository = new HealthRepository(() => prisma);
    await expect(repository.pingDatabase()).resolves.toEqual({
      kind: "error",
      detail: "Error: connection refused",
    });
  });
});
