import type { NextFunction, Request, Response } from "express";
import { logger } from "../core/logger";
import type { AuthProvider } from "../infrastructure/auth/AuthProvider";
import { defaultDisplayName } from "../modules/auth/Auth.service";
import type { AuthRepository } from "../modules/auth/Auth.repository";

/**
 * Bearer-token authentication. Verifies the token with the auth provider, then loads (or creates on
 * first sight) the matching profile row and exposes it as `req.user`.
 * Responses: 401 `No token provided` / `Invalid token`, 503 when the profile lookup fails.
 */
export function createAuthMiddleware(
  authProvider: AuthProvider,
  users: Pick<AuthRepository, "findOrCreateUser">,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    let authUser;
    try {
      authUser = await authProvider.getUser(token);
    } catch (error) {
      logger.error("Auth middleware error", { message: String(error) });
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    if (!authUser) {
      logger.warn("Token verification failed");
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    try {
      const profile = await users.findOrCreateUser({
        id: authUser.id,
        name: defaultDisplayName(authUser),
        role: "user",
      });
      req.user = { id: profile.id, name: profile.name, role: profile.role, email: authUser.email };
      next();
    } catch (error) {
      logger.error("Local user lookup failed during authentication", { message: String(error) });
      res.status(503).json({ error: "User profile service unavailable" });
    }
  };
}
