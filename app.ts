import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { PrismaClient } from "@prisma/client";
import { createCorsOptions } from "./config/cors";
import { createRateLimits } from "./config/rateLimits";
import { supabase, supabaseStorage } from "./lib/supabase";
import { profileUpload } from "./lib/upload";
import { createAuthRouter } from "./routes/auth";
import { createAiRouter } from "./routes/ai";
import { createAnalyticsRouter } from "./routes/analytics";
import { createDashboardRouter } from "./routes/dashboard";
import { createDinosaursRouter } from "./routes/dinosaurs";
import { createFavoritesRouter } from "./routes/favorites";
import { createForumRouter } from "./routes/forum";
import { createHealthRouter } from "./routes/health";
import { createPaypalRouter } from "./routes/paypal";
import { createProfileRouter } from "./routes/profile";
import { createQuizzesRouter } from "./routes/quizzes";
import { createScoresRouter } from "./routes/scores";
import { createSearchRouter } from "./routes/search";
import { createSubscriptionRouter } from "./routes/subscription";
import { createUsersRouter } from "./routes/users";
import { errorHandler } from "./middleware/errorHandler";
import { createAuthMiddleware } from "./middleware/auth";
import { adminMiddleware } from "./middleware/admin";

const app = express();
let prisma: PrismaClient | undefined;

export function setPrismaClient(client: PrismaClient): void {
  prisma = client;
}

const { general: limiter, auth: authLimiter, ai: aiLimiter } = createRateLimits();
const profileStorageBucket = process.env.SUPABASE_PROFILE_BUCKET || "profile-pictures";

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
app.use(limiter);

const lazyPrisma = new Proxy({} as PrismaClient, {
  get: (_target, property) => {
    if (!prisma) throw new Error("Database unavailable");
    return (prisma as any)[property];
  },
});

const routeDependencies = {
  prisma: lazyPrisma,
  supabase,
  supabaseStorage,
  profileStorageBucket,
  upload: profileUpload,
  authLimiter,
  aiLimiter,
  authMiddleware: createAuthMiddleware(supabase, lazyPrisma),
  adminMiddleware,
};

app.use(createHealthRouter(() => prisma));
app.get("/", (_req, res) => res.json({ message: "🦖 DinoProject Backend — READY TO ROAR! 🔥" }));
app.use(createAuthRouter(routeDependencies));
app.use(createDinosaursRouter(routeDependencies));
app.use(createQuizzesRouter(routeDependencies));
app.use(createScoresRouter(routeDependencies));
app.use(createUsersRouter(routeDependencies));
app.use(createAnalyticsRouter(routeDependencies));
app.use(createForumRouter(routeDependencies));
app.use(createSubscriptionRouter(routeDependencies));
app.use(createFavoritesRouter(routeDependencies));
app.use(createDashboardRouter(routeDependencies));
app.use(createProfileRouter(routeDependencies));
app.use(createPaypalRouter(routeDependencies));
app.use(createAiRouter(routeDependencies));
app.use(createSearchRouter(routeDependencies));
app.use(errorHandler);

export { app };
