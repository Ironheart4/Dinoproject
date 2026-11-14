import { describe, expect, it, vi } from "vitest";
import type { HealthRepository } from "../../modules/health/Health.repository";
import { HealthService } from "../../modules/health/Health.service";

function mockRepository(
  ping: HealthRepository["pingDatabase"],
): HealthRepository {
  return { pingDatabase: ping } as HealthRepository;
}

describe("HealthService", () => {
  it("getLiveness returns ok and an ISO timestamp", () => {
    const service = new HealthService(mockRepository(vi.fn()));
    const result = service.getLiveness();
    expect(result.status).toBe("ok");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it("getDatabaseHealth maps unavailable ping", async () => {
    const service = new HealthService(
      mockRepository(async () => ({ kind: "unavailable" })),
    );
    await expect(service.getDatabaseHealth()).resolves.toEqual({
      ok: false,
      detail: "Database unavailable",
    });
  });

  it("getDatabaseHealth maps successful ping", async () => {
    const service = new HealthService(
      mockRepository(async () => ({ kind: "ok" })),
    );
    await expect(service.getDatabaseHealth()).resolves.toEqual({ ok: true });
  });

  it("getDatabaseHealth maps error ping detail", async () => {
    const service = new HealthService(
      mockRepository(async () => ({ kind: "error", detail: "boom" })),
    );
    await expect(service.getDatabaseHealth()).resolves.toEqual({
      ok: false,
      detail: "boom",
    });
  });
});
