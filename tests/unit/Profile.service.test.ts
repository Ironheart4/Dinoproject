import { describe, expect, it, vi } from "vitest";
import { BadRequestError, NotFoundError } from "../../core/errors";
import { objectPathFromPublicUrl } from "../../infrastructure/storage/SupabaseStorageProvider";
import type { StorageProvider } from "../../infrastructure/storage/StorageProvider";
import type { ProfileRepository } from "../../modules/profile/Profile.repository";
import { ProfileService, buildProfilePicPath } from "../../modules/profile/Profile.service";

function mockRepository(overrides: Partial<ProfileRepository> = {}): ProfileRepository {
  return {
    findUserWithSubscription: vi.fn().mockResolvedValue(null),
    findProfilePic: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn(),
    setProfilePic: vi.fn(),
    ...overrides,
  } as unknown as ProfileRepository;
}

function mockStorage(overrides: Partial<StorageProvider> = {}): StorageProvider {
  return {
    uploadPublicImage: vi.fn().mockResolvedValue("https://x.supabase.co/storage/v1/object/public/pics/u1/new.png"),
    removeObject: vi.fn().mockResolvedValue(undefined),
    publicUrlToObjectPath: vi.fn().mockImplementation((url: string) =>
      objectPathFromPublicUrl(url, "pics"),
    ),
    ...overrides,
  };
}

describe("objectPathFromPublicUrl", () => {
  it("extracts the path from a full public URL (the old check never matched)", () => {
    expect(
      objectPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/pics/u1/a.png", "pics"),
    ).toBe("u1/a.png");
  });

  it("ignores query strings and foreign URLs", () => {
    expect(
      objectPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/pics/u1/a.png?t=1", "pics"),
    ).toBe("u1/a.png");
    expect(objectPathFromPublicUrl("https://other.example/avatar.png", "pics")).toBeNull();
    expect(objectPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/other/a.png", "pics")).toBeNull();
  });
});

describe("buildProfilePicPath", () => {
  it("builds a per-user path with the right extension", () => {
    expect(buildProfilePicPath("u1", "image/jpeg", 1000, () => 0.5)).toBe("u1/1000-500000000.jpg");
    expect(buildProfilePicPath("u1", "image/png", 1000, () => 0)).toBe("u1/1000-0.png");
  });
});

describe("ProfileService", () => {
  it("getMe throws NotFoundError for an unknown user and defaults the subscription", async () => {
    await expect(new ProfileService(mockRepository(), mockStorage()).getMe("u1", "a@b.c")).rejects.toThrow(
      NotFoundError,
    );

    const user = { id: "u1", name: "Ayo", bio: null, role: "user", createdAt: new Date(), subscription: null };
    const service = new ProfileService(
      mockRepository({ findUserWithSubscription: vi.fn().mockResolvedValue(user) }),
      mockStorage(),
    );
    expect((await service.getMe("u1", "a@b.c")).subscription).toEqual({ plan: "free", status: "active" });
  });

  it("updateProfile ignores an empty name and keeps an explicit null bio", async () => {
    const updateProfile = vi.fn().mockResolvedValue({ id: "u1", name: "Old", bio: null, profilePic: null });
    const service = new ProfileService(mockRepository({ updateProfile }), mockStorage());
    await service.updateProfile("u1", "a@b.c", { name: "   ", bio: null });
    expect(updateProfile).toHaveBeenCalledWith("u1", { bio: null });
  });

  it("updateProfile trims the name", async () => {
    const updateProfile = vi.fn().mockResolvedValue({ id: "u1", name: "Ayo", bio: "x", profilePic: null });
    const service = new ProfileService(mockRepository({ updateProfile }), mockStorage());
    await service.updateProfile("u1", "a@b.c", { name: " Ayo ", bio: "x" });
    expect(updateProfile).toHaveBeenCalledWith("u1", { name: "Ayo", bio: "x" });
  });

  it("uploadProfilePicture rejects a missing or non-image file", async () => {
    const service = new ProfileService(mockRepository(), mockStorage());
    await expect(service.uploadProfilePicture("u1", undefined)).rejects.toThrow("No file uploaded");
    await expect(
      service.uploadProfilePicture("u1", { buffer: Buffer.from("x"), mimetype: "application/pdf" }),
    ).rejects.toThrow(BadRequestError);
  });

  it("uploadProfilePicture saves the new URL and removes the previous file", async () => {
    const storage = mockStorage();
    const setProfilePic = vi.fn().mockResolvedValue({ profilePic: "https://x.supabase.co/storage/v1/object/public/pics/u1/new.png" });
    const service = new ProfileService(
      mockRepository({
        findProfilePic: vi.fn().mockResolvedValue("https://x.supabase.co/storage/v1/object/public/pics/u1/old.png"),
        setProfilePic,
      }),
      storage,
    );
    const result = await service.uploadProfilePicture("u1", { buffer: Buffer.from("x"), mimetype: "image/png" });
    expect(result.message).toBe("Profile picture updated successfully");
    expect(storage.removeObject).toHaveBeenCalledWith("u1/old.png");
  });

  it("uploadProfilePicture removes the new file again when saving the URL fails", async () => {
    const storage = mockStorage();
    const service = new ProfileService(
      mockRepository({ setProfilePic: vi.fn().mockRejectedValue(new Error("db down")) }),
      storage,
    );
    await expect(
      service.uploadProfilePicture("u1", { buffer: Buffer.from("x"), mimetype: "image/png" }),
    ).rejects.toThrow("db down");
    expect(storage.removeObject).toHaveBeenCalledTimes(1);
  });

  it("removeProfilePicture deletes the stored file and clears the column", async () => {
    const storage = mockStorage();
    const setProfilePic = vi.fn().mockResolvedValue({});
    const service = new ProfileService(
      mockRepository({
        findProfilePic: vi.fn().mockResolvedValue("https://x.supabase.co/storage/v1/object/public/pics/u1/old.png"),
        setProfilePic,
      }),
      storage,
    );
    await expect(service.removeProfilePicture("u1")).resolves.toEqual({
      message: "Profile picture removed successfully",
    });
    expect(storage.removeObject).toHaveBeenCalledWith("u1/old.png");
    expect(setProfilePic).toHaveBeenCalledWith("u1", null);
  });
});
