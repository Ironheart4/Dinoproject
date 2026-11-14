import type { HealthRepository } from "./Health.repository";

export interface LivenessResult {
  status: "ok";
  timestamp: string;
}

export type DatabaseHealthResult =
  | { ok: true }
  | { ok: false; detail: string };

/**
 * Health domain logic. No Express types here.
 */
export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  getLiveness(): LivenessResult {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth(): Promise<DatabaseHealthResult> {
    const ping = await this.repository.pingDatabase();
    if (ping.kind === "ok") return { ok: true };
    if (ping.kind === "unavailable") {
      return { ok: false, detail: "Database unavailable" };
    }
    return { ok: false, detail: ping.detail };
  }
}
