import type { Dinosaur, PrismaClient } from "@prisma/client";
import { ConflictError, ServiceUnavailableError } from "../../core/errors";

/** Plain data accepted by create and update (all optional fields are nullable). */
export interface DinosaurWriteData {
  name: string;
  species: string;
  period: string | null;
  diet: string | null;
  habitat: string | null;
  lengthMeters: number | null;
  weightKg: number | null;
  description: string | null;
  modelUrl: string;
  roarSound: string | null;
  imageUrl: string | null;
  imageUrl1: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  imageUrl4: string | null;
  imageUrl5: string | null;
  videoUrl: string | null;
  wikipedia: string | null;
  taxonomy: string | null;
  type: string | null;
  livedIn: string | null;
  namedBy: string | null;
}

/** Prisma error codes: record not found, unique constraint violated. */
const RECORD_NOT_FOUND = "P2025";
const UNIQUE_VIOLATION = "P2002";

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}

const DUPLICATE_SPECIES_MESSAGE = "A dinosaur with this species already exists";

/**
 * Prisma access for dinosaurs. Only repositories touch Prisma.
 */
export class DinosaursRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findAll(): Promise<Dinosaur[]> {
    return this.requirePrisma().dinosaur.findMany({ orderBy: { name: "asc" } });
  }

  findFeatured(limit: number): Promise<Dinosaur[]> {
    return this.requirePrisma().dinosaur.findMany({
      where: {
        OR: [{ imageUrl1: { not: undefined } }, { modelUrl: { not: undefined } }],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: number): Promise<Dinosaur | null> {
    return this.requirePrisma().dinosaur.findUnique({ where: { id } });
  }

  async create(data: DinosaurWriteData): Promise<Dinosaur> {
    try {
      return await this.requirePrisma().dinosaur.create({ data });
    } catch (error) {
      if (hasPrismaCode(error, UNIQUE_VIOLATION)) throw new ConflictError(DUPLICATE_SPECIES_MESSAGE);
      throw error;
    }
  }

  /** Returns null when the dinosaur does not exist. */
  async update(id: number, data: DinosaurWriteData): Promise<Dinosaur | null> {
    try {
      return await this.requirePrisma().dinosaur.update({ where: { id }, data });
    } catch (error) {
      if (hasPrismaCode(error, RECORD_NOT_FOUND)) return null;
      if (hasPrismaCode(error, UNIQUE_VIOLATION)) throw new ConflictError(DUPLICATE_SPECIES_MESSAGE);
      throw error;
    }
  }

  /**
   * Deletes a dinosaur and its favorites in one transaction (the database foreign key
   * has no ON DELETE CASCADE). Returns false when the dinosaur does not exist.
   */
  async delete(id: number): Promise<boolean> {
    const prisma = this.requirePrisma();
    try {
      await prisma.$transaction(async (tx) => {
        await tx.favorite.deleteMany({ where: { dinoId: id } });
        await tx.dinosaur.delete({ where: { id } });
      });
      return true;
    } catch (error) {
      if (hasPrismaCode(error, RECORD_NOT_FOUND)) return false;
      throw error;
    }
  }
}
