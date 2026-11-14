import type { SupabaseClient } from "@supabase/supabase-js";
import { BadRequestError, UnauthorizedError } from "../../core/errors";
import { logger } from "../../core/logger";
import type {
  AuthProvider,
  AuthRefreshResult,
  AuthSignInResult,
  AuthSignUpInput,
  AuthSignUpResult,
  AuthUserInfo,
} from "./AuthProvider";

export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async signUp(input: AuthSignUpInput): Promise<AuthSignUpResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error) {
      logger.error("Supabase signup error", { message: error.message });
      throw new BadRequestError(error.message);
    }
    if (!data.user) throw new BadRequestError("Registration failed");
    return { userId: data.user.id, email: data.user.email };
  }

  async signIn(email: string, password: string): Promise<AuthSignInResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.error("Supabase login error", { message: error.message });
      throw new UnauthorizedError("Invalid credentials");
    }
    if (!data.user || !data.session) throw new UnauthorizedError("Login failed");
    return {
      userId: data.user.id,
      email: data.user.email,
      nameFromMetadata: data.user.user_metadata?.name as string | undefined,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async refresh(refreshToken: string): Promise<AuthRefreshResult> {
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) throw new UnauthorizedError("Invalid refresh token");
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async getUser(accessToken: string): Promise<AuthUserInfo | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name as string | undefined,
    };
  }
}
