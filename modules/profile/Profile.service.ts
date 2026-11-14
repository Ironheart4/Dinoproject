import { BadRequestError, NotFoundError } from "../../core/errors";
import type { StorageProvider } from "../../infrastructure/storage/StorageProvider";
import type { ProfileRepository } from "./Profile.repository";
import { ALLOWED_IMAGE_TYPES, type AllowedImageType, type UpdateProfileBody } from "./Profile.schemas";

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

/** Storage path for a user's picture: unique per upload so old URLs never serve stale caches. */
export function buildProfilePicPath(
  userId: string,
  mimetype: AllowedImageType,
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  return `${userId}/${now}-${Math.round(random() * 1e9)}.${ALLOWED_IMAGE_TYPES[mimetype]}`;
}

function isAllowedImageType(mimetype: string): mimetype is AllowedImageType {
  return Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_TYPES, mimetype);
}

/**
 * Profile domain logic (own details, name and bio, profile picture). No Express types here.
 */
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly storage: StorageProvider,
  ) {}

  async getMe(userId: string, email: string | undefined) {
    const user = await this.repository.findUserWithSubscription(userId);
    if (!user) throw new NotFoundError("User not found");
    return {
      id: user.id,
      name: user.name,
      email,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      subscription: user.subscription || { plan: "free", status: "active" },
    };
  }

  async updateProfile(userId: string, email: string | undefined, input: UpdateProfileBody) {
    const name = input.name?.trim();
    const updated = await this.repository.updateProfile(userId, {
      ...(name ? { name } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
    });
    return {
      id: updated.id,
      name: updated.name,
      email,
      bio: updated.bio,
      profilePic: updated.profilePic,
    };
  }

  /** Uploads the new picture, saves its URL, then removes the previous file (best effort). */
  async uploadProfilePicture(userId: string, file: UploadedImage | undefined) {
    if (!file) throw new BadRequestError("No file uploaded");
    if (!isAllowedImageType(file.mimetype)) {
      throw new BadRequestError("Only image files allowed (jpeg, jpg, png, webp, gif)");
    }

    const path = buildProfilePicPath(userId, file.mimetype);
    const publicUrl = await this.storage.uploadPublicImage(path, file.buffer, file.mimetype);
    const previous = await this.repository.findProfilePic(userId);

    let updated;
    try {
      updated = await this.repository.setProfilePic(userId, publicUrl);
    } catch (error) {
      await this.storage.removeObject(path).catch(() => undefined);
      throw error;
    }

    await this.removeStoredPicture(previous);
    return { profilePic: updated.profilePic, message: "Profile picture updated successfully" };
  }

  async removeProfilePicture(userId: string) {
    const previous = await this.repository.findProfilePic(userId);
    await this.removeStoredPicture(previous);
    await this.repository.setProfilePic(userId, null);
    return { message: "Profile picture removed successfully" };
  }

  private async removeStoredPicture(publicUrl: string | null): Promise<void> {
    if (!publicUrl) return;
    const objectPath = this.storage.publicUrlToObjectPath(publicUrl);
    if (!objectPath) return;
    await this.storage.removeObject(objectPath).catch(() => undefined);
  }
}
