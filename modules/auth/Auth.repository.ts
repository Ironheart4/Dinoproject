import type { PrismaClient, Subscription, User } from "@prisma/client";
import { BadRequestError, ServiceUnavailableError } from "../../core/errors";

export type UserWithSubscription = User & { subscription: Subscription | null };

export interface NewUser {
  id: string;
  name: string;
  role: string;
}

/** Prisma error code for a unique constraint violation. */
const UNIQUE_VIOLATION = "P2002";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * Prisma access for user profile rows (the `users` table mirrors Supabase Auth users).
 * Only repositories touch Prisma.
 */
export class AuthRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findUserById(id: string): Promise<User | null> {
    return this.requirePrisma().user.findUnique({ where: { id } });
  }

  findUserWithSubscription(id: string): Promise<UserWithSubscription | null> {
    return this.requirePrisma().user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  /** Creates the profile row. A duplicate id returns 400 `User already exists` (kept from the old route). */
  async createUser(data: NewUser): Promise<User> {
    try {
      return await this.requirePrisma().user.create({ data });
    } catch (error) {
      if (isUniqueViolation(error)) throw new BadRequestError("User already exists");
      throw error;
    }
  }

  /**
   * Returns the profile row, creating it on first sight (covers users who signed up but whose
   * profile insert failed). Safe under two simultaneous first requests.
   */
  async findOrCreateUser(data: NewUser): Promise<User> {
    const existing = await this.findUserById(data.id);
    if (existing) return existing;
    try {
      return await this.requirePrisma().user.create({ data });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.findUserById(data.id);
      if (raced) return raced;
      throw error;
    }
  }
}
