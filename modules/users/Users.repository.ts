import type { PrismaClient } from "@prisma/client";
import { ServiceUnavailableError } from "../../core/errors";

export type UserListRow = {
  id: string;
  name: string | null;
  role: string;
  createdAt: Date;
  subscription: { plan: string; status: string } | null;
};

export type UserRoleRow = {
  id: string;
  name: string | null;
  role: string;
};

/**
 * Prisma access for admin user management. Only repositories touch Prisma.
 */
export class UsersRepository {
  constructor(private readonly getPrisma: () => PrismaClient | undefined) {}

  private requirePrisma(): PrismaClient {
    const prisma = this.getPrisma();
    if (!prisma) {
      throw new ServiceUnavailableError("Database unavailable");
    }
    return prisma;
  }

  async findManyWithSubscription(): Promise<UserListRow[]> {
    return this.requirePrisma().user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countAdmins(): Promise<number> {
    return this.requirePrisma().user.count({ where: { role: "admin" } });
  }

  async findRoleById(id: string): Promise<{ role: string } | null> {
    return this.requirePrisma().user.findUnique({
      where: { id },
      select: { role: true },
    });
  }

  async updateRole(id: string, role: string): Promise<UserRoleRow> {
    return this.requirePrisma().user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
  }
}
