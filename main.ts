/**
 * Composition root: wires concrete infrastructure by hand (no DI container).
 * This is the only place providers, middleware and limiters are constructed.
 */
import type { PrismaClient } from "@prisma/client";
import { env } from "./config/env";
import { createRateLimits } from "./config/rateLimits";
import type { AppDependencies } from "./core/dependencies";
import { logger } from "./core/logger";
import { HuggingFaceAiProvider } from "./infrastructure/ai/HuggingFaceAiProvider";
import { SupabaseAuthProvider } from "./infrastructure/auth/SupabaseAuthProvider";
import { PaypalPaymentProvider } from "./infrastructure/payments/PaypalPaymentProvider";
import { profileUpload } from "./infrastructure/storage/profileUpload";
import { SupabaseStorageProvider } from "./infrastructure/storage/SupabaseStorageProvider";
import { supabase, supabaseStorage } from "./infrastructure/supabase/clients";
import { adminMiddleware } from "./middleware/admin";
import { createAuthMiddleware } from "./middleware/auth";
import { createLocalDinoResponder } from "./modules/ai/Ai.localResponder";
import { AuthRepository } from "./modules/auth/Auth.repository";

export interface CreateAppDependenciesOptions {
  getPrisma: () => PrismaClient | undefined;
}

/**
 * Build the full dependency graph for the Express app.
 * Prisma is injected lazily so tests can import the app without a database.
 */
export function createAppDependencies(options: CreateAppDependenciesOptions): AppDependencies {
  const { getPrisma } = options;
  const { general, auth: authLimiter, ai: aiLimiter } = createRateLimits();

  const authProvider = new SupabaseAuthProvider(supabase);
  const paymentProvider = new PaypalPaymentProvider();
  const storageProvider = new SupabaseStorageProvider(supabaseStorage, env.profileBucket);

  // The AI provider falls back to the local responder (matching dinosaur, then built-in FAQ).
  const localResponder = createLocalDinoResponder(getPrisma);
  const aiProvider = new HuggingFaceAiProvider(
    env.huggingFaceApiKey,
    localResponder.respond,
    env.huggingFaceModel,
  );

  logger.info("Application dependencies composed", {
    paypalConfigured: paymentProvider.isConfigured(),
    aiConfigured: Boolean(env.huggingFaceApiKey),
    aiModel: env.huggingFaceModel || undefined,
    profileBucket: env.profileBucket,
  });

  return {
    getPrisma,
    authProvider,
    paymentProvider,
    aiProvider,
    storageProvider,
    authMiddleware: createAuthMiddleware(authProvider, new AuthRepository(getPrisma)),
    adminMiddleware,
    authLimiter,
    aiLimiter,
    generalLimiter: general,
    upload: profileUpload,
  };
}
