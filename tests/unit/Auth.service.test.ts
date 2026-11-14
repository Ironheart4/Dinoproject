import { describe, expect, it, vi } from "vitest";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../core/errors";
import type { AuthProvider } from "../../infrastructure/auth/AuthProvider";
import type { AuthRepository } from "../../modules/auth/Auth.repository";
import { AuthService, defaultDisplayName } from "../../modules/auth/Auth.service";

function mockProvider(overrides: Partial<AuthProvider> = {}): AuthProvider {
  return {
    signUp: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b.c" }),
    signIn: vi.fn().mockResolvedValue({
      userId: "u1",
      email: "a@b.c",
      nameFromMetadata: undefined,
      accessToken: "at",
      refreshToken: "rt",
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue({ accessToken: "at2", refreshToken: "rt2" }),
    getUser: vi.fn(),
    ...overrides,
  };
}

function mockRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    createUser: vi.fn().mockImplementation(async (d: { id: string; name: string; role: string }) => d),
    findOrCreateUser: vi.fn().mockImplementation(async (d: { id: string; name: string; role: string }) => d),
    findUserWithSubscription: vi.fn().mockResolvedValue(null),
    findUserById: vi.fn(),
    ...overrides,
  } as unknown as AuthRepository;
}

describe("defaultDisplayName", () => {
  it("prefers the name, then the email prefix, then a generic name", () => {
    expect(defaultDisplayName({ name: "Ayo", email: "x@y.z" })).toBe("Ayo");
    expect(defaultDisplayName({ email: "ayo@y.z" })).toBe("ayo");
    expect(defaultDisplayName({})).toBe("User");
  });
});

describe("AuthService.register", () => {
  it("creates the profile with the default user role", async () => {
    const repository = mockRepository();
    const result = await new AuthService(mockProvider(), repository).register({
      name: "Ayo",
      email: "a@b.c",
      password: "secret1",
    });
    expect(repository.createUser).toHaveBeenCalledWith({ id: "u1", name: "Ayo", role: "user" });
    expect(result).toMatchObject({ id: "u1", name: "Ayo", email: "a@b.c" });
    expect(result.message).toContain("check your email");
  });

  it("propagates provider errors (such as an existing email)", async () => {
    const provider = mockProvider({ signUp: vi.fn().mockRejectedValue(new BadRequestError("User already registered")) });
    await expect(
      new AuthService(provider, mockRepository()).register({ name: "A", email: "a@b.c", password: "secret1" }),
    ).rejects.toThrow("User already registered");
  });
});

describe("AuthService.login", () => {
  it("returns tokens and the profile, creating the profile from the email prefix when needed", async () => {
    const repository = mockRepository();
    const result = await new AuthService(mockProvider(), repository).login({ email: "ayo@b.c", password: "x" });
    expect(repository.findOrCreateUser).toHaveBeenCalledWith({ id: "u1", name: "ayo", role: "user" });
    expect(result).toEqual({
      token: "at",
      refreshToken: "rt",
      user: { id: "u1", name: "ayo", email: "a@b.c", role: "user" },
    });
  });

  it("propagates invalid credentials", async () => {
    const provider = mockProvider({ signIn: vi.fn().mockRejectedValue(new UnauthorizedError("Invalid credentials")) });
    await expect(new AuthService(provider, mockRepository()).login({ email: "a@b.c", password: "x" })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

describe("AuthService.logout / refresh / me", () => {
  it("signs out only when a token was sent, with the same message either way", async () => {
    const provider = mockProvider();
    const service = new AuthService(provider, mockRepository());
    await expect(service.logout("tok")).resolves.toEqual({ message: "Logged out successfully" });
    await expect(service.logout(undefined)).resolves.toEqual({ message: "Logged out successfully" });
    expect(provider.signOut).toHaveBeenCalledTimes(1);
  });

  it("refresh returns the new token pair", async () => {
    const service = new AuthService(mockProvider(), mockRepository());
    await expect(service.refresh("rt")).resolves.toEqual({ token: "at2", refreshToken: "rt2" });
  });

  it("me throws NotFoundError for an unknown user and returns the subscription as stored", async () => {
    await expect(new AuthService(mockProvider(), mockRepository()).me("u1", "a@b.c")).rejects.toThrow(NotFoundError);

    const user = { id: "u1", name: "Ayo", role: "admin", createdAt: new Date(), subscription: null };
    const service = new AuthService(
      mockProvider(),
      mockRepository({ findUserWithSubscription: vi.fn().mockResolvedValue(user) }),
    );
    await expect(service.me("u1", "a@b.c")).resolves.toMatchObject({ role: "admin", subscription: null, email: "a@b.c" });
  });
});
