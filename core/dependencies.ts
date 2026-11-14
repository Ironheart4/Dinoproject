import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import type { Multer } from "multer";
import type { AiProvider } from "../infrastructure/ai/AiProvider";
import type { AuthProvider } from "../infrastructure/auth/AuthProvider";
import type { PaymentProvider } from "../infrastructure/payments/PaymentProvider";
import type { StorageProvider } from "../infrastructure/storage/StorageProvider";

/**
 * Hand-wired application dependencies (built in `main.ts`, consumed by `app.ts`).
 * Outside systems sit behind interfaces so tests can substitute fakes.
 */
export interface AppDependencies {
  /** Returns the Prisma client once the database is connected (undefined before that). */
  getPrisma: () => PrismaClient | undefined;
  authProvider: AuthProvider;
  paymentProvider: PaymentProvider;
  aiProvider: AiProvider;
  storageProvider: StorageProvider;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  authLimiter: RequestHandler;
  aiLimiter: RequestHandler;
  generalLimiter: RequestHandler;
  upload: Multer;
}
