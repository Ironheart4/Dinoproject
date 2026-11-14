import type { PrismaClient } from "@prisma/client";

export type DatabasePingResult =
  | { kind: "ok" }
  | { kind: "unavailable" }
  | { kind: "error"; detail: string };

/**
 * Prisma access for health checks. Only repositories touch Prisma.
 */
export class HealthRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  async pingDatabase(): Promise<DatabasePingResult> {
    const prisma = this.getPrisma();
    if (!prisma) return { kind: "unavailable" };

    try {
      await prisma.$queryRaw`SELECT 1`;
      return { kind: "ok" };
    } catch (error) {
      return { kind: "error", detail: String(error) };
    }
  }
}
