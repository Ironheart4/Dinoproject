import { BadRequestError } from "../../core/errors";
import type { UsersRepository } from "./Users.repository";

export type ListedUser = {
  id: string;
  name: string | null;
  role: string;
  createdAt: Date;
  subscription: { plan: string; status: string } | null;
  subscriptionTier: string;
  subscriptionStatus: string;
};

/**
 * Admin user management domain logic. No Express types here.
 */
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async listUsers(): Promise<ListedUser[]> {
    const users = await this.repository.findManyWithSubscription();
    return users.map((user) => ({
      ...user,
      subscriptionTier: user.subscription?.plan || "free",
      subscriptionStatus: user.subscription?.status || "active",
    }));
  }

  async updateRole(
    id: string,
    role: "user" | "admin",
    actorId: string,
  ): Promise<{ id: string; name: string | null; role: string }> {
    if (id === actorId && role !== "admin") {
      throw new BadRequestError("You cannot demote yourself");
    }

    if (role !== "admin") {
      const adminCount = await this.repository.countAdmins();
      const target = await this.repository.findRoleById(id);
      if (target?.role === "admin" && adminCount <= 1) {
        throw new BadRequestError("The last admin cannot be demoted");
      }
    }

    return this.repository.updateRole(id, role);
  }
}
