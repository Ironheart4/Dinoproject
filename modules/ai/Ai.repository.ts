import type { Dinosaur, PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

/**
 * Prisma access for the AI assistant dinosaur lookup. Only repositories touch Prisma.
 */
export class AiRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findDinosaurs(limit: number): Promise<Dinosaur[]> {
    return this.requirePrisma().dinosaur.findMany({ take: limit });
  }
}
