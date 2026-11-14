import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { PrismaClient } from "@prisma/client";
import { createCorsOptions } from "./config/cors";
import { env } from "./config/env";
import type { AppDependencies } from "./core/dependencies";
import { createAppDependencies } from "./main";
import { errorHandler } from "./middleware/errorHandler";
import { createAiRouter } from "./modules/ai/Ai.routes";
import { createAnalyticsRouter } from "./modules/analytics/Analytics.routes";
import { createAuthRouter } from "./modules/auth/Auth.routes";
import { createDashboardRouter } from "./modules/dashboard/Dashboard.routes";
import { createDinosaursRouter } from "./modules/dinosaurs/Dinosaurs.routes";
import { createFavoritesRouter } from "./modules/favorites/Favorites.routes";
import { createForumRouter } from "./modules/forum/Forum.routes";
import { createHealthRouter } from "./modules/health/Health.routes";
import { createPaypalRouter } from "./modules/paypal/Paypal.routes";
import { createProfileRouter } from "./modules/profile/Profile.routes";
import { createQuizzesRouter } from "./modules/quizzes/Quizzes.routes";
import { createScoresRouter } from "./modules/scores/Scores.routes";
import { createSearchRouter } from "./modules/search/Search.routes";
import { createSubscriptionRouter } from "./modules/subscription/Subscription.routes";
import { createUsersRouter } from "./modules/users/Users.routes";

let prisma: PrismaClient | undefined;

export function setPrismaClient(client: PrismaClient): void {
  prisma = client;
}

export function getPrismaClient(): PrismaClient | undefined {
  return prisma;
}

/**
 * Build the Express application from a hand-wired dependency bag.
 * Does not listen: `server.ts` owns the process lifecycle.
 * Router order matters only where noted in each module (for example `/recommend` before `/:id`).
 */
export function createApp(deps: AppDependencies) {
  const app = express();
  const { getPrisma, authMiddleware, adminMiddleware } = deps;

  app.use(cors(createCorsOptions()));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.supabase.co"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(deps.generalLimiter);

  app.use(createHealthRouter(getPrisma));
  app.get("/", (_req, res) => res.json({ message: "🦖 DinoProject Backend — READY TO ROAR! 🔥" }));
  app.use(createAuthRouter({ getPrisma, authProvider: deps.authProvider, authMiddleware, authLimiter: deps.authLimiter }));
  app.use(createDinosaursRouter({ getPrisma, authMiddleware, adminMiddleware }));
  app.use(createQuizzesRouter({ getPrisma, authMiddleware, adminMiddleware }));
  app.use(createScoresRouter({ getPrisma, authMiddleware }));
  app.use(createUsersRouter({ getPrisma, authMiddleware, adminMiddleware }));
  app.use(createAnalyticsRouter({ getPrisma, authMiddleware, adminMiddleware }));
  app.use(createForumRouter({ getPrisma, authMiddleware }));
  app.use(createSubscriptionRouter({ getPrisma, authMiddleware, adminMiddleware }));
  app.use(createFavoritesRouter({ getPrisma, authMiddleware }));
  app.use(createDashboardRouter({ getPrisma, authMiddleware }));
  app.use(createProfileRouter({ getPrisma, authMiddleware, upload: deps.upload, storageProvider: deps.storageProvider }));
  app.use(createPaypalRouter({ getPrisma, authMiddleware, paymentProvider: deps.paymentProvider, frontendUrl: env.frontendUrl }));
  app.use(createAiRouter({ getPrisma, authMiddleware, aiLimiter: deps.aiLimiter, aiProvider: deps.aiProvider }));
  app.use(createSearchRouter(getPrisma));
  app.use(errorHandler);

  return app;
}

const defaultDependencies = createAppDependencies({ getPrisma: getPrismaClient });
const app = createApp(defaultDependencies);

export { app, defaultDependencies };
