import type { PrismaClient, Subscription, User } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type UserWithSubscription = User & { subscription: Subscription | null };

/**
 * Prisma access for the user's own profile. Only repositories touch Prisma.
 */
export class ProfileRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  findUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
    return this.requirePrisma().user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
  }

  async findProfilePic(userId: string): Promise<string | null> {
    const user = await this.requirePrisma().user.findUnique({
      where: { id: userId },
      select: { profilePic: true },
    });
    return user?.profilePic ?? null;
  }

  updateProfile(userId: string, data: { name?: string; bio?: string | null }): Promise<User> {
    return this.requirePrisma().user.update({ where: { id: userId }, data });
  }

  setProfilePic(userId: string, profilePic: string | null): Promise<User> {
    return this.requirePrisma().user.update({ where: { id: userId }, data: { profilePic } });
  }
}
