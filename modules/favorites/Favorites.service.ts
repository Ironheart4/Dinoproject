import type { Favorite, Subscription } from "@prisma/client";
import { ForbiddenError } from "../../core/errors";
import { hasActivePaidAccess } from "../../core/subscriptionAccess";
import type { FavoritesRepository, FavoriteWithDinosaur } from "./Favorites.repository";

const FREE_FAVORITE_LIMIT = 5;

const FREE_LIMIT_MESSAGE =
  "Free users can only save up to 5 favorites. Upgrade to unlock unlimited favorites!";

export type AddFavoriteResult =
  | { created: false; favorite: Favorite }
  | { created: true; favorite: Favorite };

/**
 * Favorites domain logic. No Express types here.
 */
export class FavoritesService {
  constructor(private readonly repository: FavoritesRepository) {}

  listFavorites(userId: string): Promise<FavoriteWithDinosaur[]> {
    return this.repository.findManyByUserId(userId);
  }

  async checkFavorite(
    userId: string,
    dinoId: number,
  ): Promise<{ isFavorited: boolean }> {
    const favorite = await this.repository.findByUserAndDino(userId, dinoId);
    return { isFavorited: !!favorite };
  }

  async addFavorite(userId: string, dinoId: number): Promise<AddFavoriteResult> {
    const existing = await this.repository.findByUserAndDino(userId, dinoId);
    if (existing) return { created: false, favorite: existing };

    const subscription = await this.repository.findSubscriptionByUserId(userId);
    if (!isPremiumOrActiveDonor(subscription)) {
      const currentCount = await this.repository.countByUserId(userId);
      if (currentCount >= FREE_FAVORITE_LIMIT) {
        throw new ForbiddenError(FREE_LIMIT_MESSAGE, { limitReached: true });
      }
    }

    const favorite = await this.repository.create(userId, dinoId);
    return { created: true, favorite };
  }

  async removeFavorite(
    userId: string,
    dinoId: number,
  ): Promise<{ success: true }> {
    await this.repository.deleteByUserAndDino(userId, dinoId);
    return { success: true };
  }
}

/**
 * Premium or active-donor gate for the favorites limit. Uses the shared rule in
 * `core/subscriptionAccess.ts` (premium with a past end date no longer counts).
 */
export function isPremiumOrActiveDonor(
  subscription: Pick<Subscription, "status" | "plan" | "endDate"> | null,
): boolean {
  return hasActivePaidAccess(subscription);
}
