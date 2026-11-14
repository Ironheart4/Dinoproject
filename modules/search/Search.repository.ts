import type { PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

const dinosaurSearchSelect = {
  id: true,
  name: true,
  species: true,
  period: true,
  imageUrl: true,
  diet: true,
} as const;

const quizSearchSelect = {
  id: true,
  title: true,
} as const;

export type SearchDinosaurRow = {
  id: number;
  name: string | null;
  species: string;
  period: string | null;
  imageUrl: string | null;
  diet: string | null;
};

export type SearchQuizRow = {
  id: number;
  title: string;
};

/**
 * Prisma access for public search. Only repositories touch Prisma.
 */
export class SearchRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  async findDinosaursByQuery(query: string): Promise<SearchDinosaurRow[]> {
    return this.requirePrisma().dinosaur.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { species: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } },
          { diet: { contains: query, mode: "insensitive" } },
        ],
      },
      select: dinosaurSearchSelect,
      take: 8,
      orderBy: { name: "asc" },
    });
  }

  async findQuizzesByQuery(query: string): Promise<SearchQuizRow[]> {
    return this.requirePrisma().quiz.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
      },
      select: quizSearchSelect,
      take: 5,
      orderBy: { title: "asc" },
    });
  }
}
