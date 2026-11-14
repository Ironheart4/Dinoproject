import { NotFoundError } from "../../core/errors";
import type { AuthProvider } from "../../infrastructure/auth/AuthProvider";
import type { AuthRepository } from "./Auth.repository";
import type { LoginBody, RegisterBody } from "./Auth.schemas";

const DEFAULT_ROLE = "user";
const REGISTERED_MESSAGE = "Registration successful! Please check your email to verify your account.";

/** Display name for a user without a stored one: metadata name, else the email prefix, else "User". */
export function defaultDisplayName(info: { name?: string; email?: string }): string {
  return info.name || info.email?.split("@")[0] || "User";
}

/**
 * Registration, login, token refresh and "who am I". Supabase Auth owns passwords and tokens
 * (behind `AuthProvider`); our `users` table owns the role and profile. No Express types here.
 */
export class AuthService {
  constructor(
    private readonly provider: AuthProvider,
    private readonly repository: AuthRepository,
  ) {}

  async register(input: RegisterBody) {
    const signedUp = await this.provider.signUp(input);
    const user = await this.repository.createUser({
      id: signedUp.userId,
      name: input.name,
      role: DEFAULT_ROLE,
    });
    return { id: user.id, name: user.name, email: signedUp.email, message: REGISTERED_MESSAGE };
  }

  async login(input: LoginBody) {
    const session = await this.provider.signIn(input.email, input.password);
    const user = await this.repository.findOrCreateUser({
      id: session.userId,
      name: defaultDisplayName({ name: session.nameFromMetadata, email: input.email }),
      role: DEFAULT_ROLE,
    });
    return {
      token: session.accessToken,
      refreshToken: session.refreshToken,
      user: { id: user.id, name: user.name, email: session.email, role: user.role },
    };
  }

  /**
   * Ends the session on the Supabase client. Access tokens are stateless JWTs and stay valid until they expire;
   * revoking one earlier would need a Supabase admin sign-out (not done here).
   */
  async logout(accessToken: string | undefined) {
    if (accessToken) await this.provider.signOut();
    return { message: "Logged out successfully" };
  }

  async refresh(refreshToken: string) {
    const session = await this.provider.refresh(refreshToken);
    return { token: session.accessToken, refreshToken: session.refreshToken };
  }

  async me(userId: string, email: string | undefined) {
    const user = await this.repository.findUserWithSubscription(userId);
    if (!user) throw new NotFoundError("User not found");
    return {
      id: user.id,
      name: user.name,
      email,
      role: user.role,
      createdAt: user.createdAt,
      subscription: user.subscription,
    };
  }
}
