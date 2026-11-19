/**
 * Route contract snapshot for the DinoProject backend.
 *
 * Phase 1 guard: freeze method + path + auth level before the layered migration.
 * Do not change paths or response shapes without an explicit decision.
 *
 * Auth levels:
 * - public: no auth middleware
 * - authenticated: authMiddleware only
 * - admin: authMiddleware + adminMiddleware
 *
 * Notes on special routes are recorded in `notes` / `orderingNotes`.
 */

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type AuthLevel = "public" | "authenticated" | "admin";

export interface RouteContractEntry {
  method: HttpMethod;
  path: string;
  auth: AuthLevel;
  /** Extra access rules beyond JWT / admin role (documented only). */
  notes?: string;
  /** Example sample path used by unauthenticated boundary tests. */
  samplePath?: string;
}

export const ROUTE_CONTRACT: RouteContractEntry[] = [
  // Root and health
  { method: "get", path: "/", auth: "public" },
  { method: "get", path: "/health", auth: "public" },
  { method: "get", path: "/health/db", auth: "public" },

  // Auth
  { method: "post", path: "/api/auth/register", auth: "public", notes: "rate-limited (authLimiter)" },
  { method: "post", path: "/api/auth/login", auth: "public", notes: "rate-limited (authLimiter)" },
  { method: "post", path: "/api/auth/logout", auth: "public" },
  { method: "post", path: "/api/auth/refresh", auth: "public" },
  { method: "get", path: "/api/auth/me", auth: "authenticated" },

  // Dinosaurs
  { method: "get", path: "/api/dinosaurs", auth: "public" },
  { method: "get", path: "/api/dinosaurs/featured", auth: "public" },
  { method: "post", path: "/api/dinosaurs", auth: "admin" },
  { method: "get", path: "/api/dinosaurs/:id", auth: "public", samplePath: "/api/dinosaurs/1" },
  { method: "put", path: "/api/dinosaurs/:id", auth: "admin", samplePath: "/api/dinosaurs/1" },
  { method: "delete", path: "/api/dinosaurs/:id", auth: "admin", samplePath: "/api/dinosaurs/1" },

  // Quizzes (recommend must remain registered before :id)
  { method: "get", path: "/api/quizzes", auth: "public" },
  { method: "post", path: "/api/quizzes", auth: "admin" },
  { method: "get", path: "/api/quizzes/recommend", auth: "authenticated" },
  { method: "get", path: "/api/quizzes/:id", auth: "public", samplePath: "/api/quizzes/1" },
  { method: "put", path: "/api/quizzes/:id", auth: "admin", samplePath: "/api/quizzes/1" },
  { method: "delete", path: "/api/quizzes/:id", auth: "admin", samplePath: "/api/quizzes/1" },
  { method: "get", path: "/api/quiz/random", auth: "public" },

  // Scores
  { method: "get", path: "/api/scores/me", auth: "authenticated" },
  { method: "post", path: "/api/scores", auth: "authenticated" },
  { method: "get", path: "/api/scores", auth: "authenticated" },

  // Users and analytics
  { method: "get", path: "/api/users", auth: "admin" },
  {
    method: "put",
    path: "/api/users/:id/role",
    auth: "admin",
    samplePath: "/api/users/1/role",
  },
  { method: "get", path: "/api/analytics", auth: "admin" },

  // Forum
  { method: "get", path: "/api/forum/categories", auth: "public" },
  { method: "get", path: "/api/forum/posts/recent", auth: "public" },
  {
    method: "get",
    path: "/api/forum/category/:slug",
    auth: "public",
    samplePath: "/api/forum/category/general",
  },
  {
    method: "get",
    path: "/api/forum/post/:id",
    auth: "public",
    samplePath: "/api/forum/post/1",
  },
  { method: "post", path: "/api/forum/posts", auth: "authenticated" },
  {
    method: "post",
    path: "/api/forum/posts/:id/replies",
    auth: "authenticated",
    samplePath: "/api/forum/posts/1/replies",
  },

  // Subscription
  { method: "get", path: "/api/subscription", auth: "authenticated" },
  { method: "post", path: "/api/subscription", auth: "admin" },
  { method: "delete", path: "/api/subscription", auth: "authenticated" },

  // Favorites
  { method: "get", path: "/api/favorites", auth: "authenticated" },
  { method: "post", path: "/api/favorites", auth: "authenticated" },
  {
    method: "get",
    path: "/api/favorites/check/:dinoId",
    auth: "authenticated",
    samplePath: "/api/favorites/check/1",
  },
  {
    method: "delete",
    path: "/api/favorites/:dinoId",
    auth: "authenticated",
    samplePath: "/api/favorites/1",
  },

  // Dashboard and profile
  { method: "get", path: "/api/dashboard/stats", auth: "authenticated" },
  { method: "get", path: "/api/dashboard/charts", auth: "authenticated" },
  { method: "get", path: "/api/dashboard/activity", auth: "authenticated" },
  { method: "put", path: "/api/user/profile", auth: "authenticated" },
  { method: "post", path: "/api/user/profile-pic", auth: "authenticated" },
  { method: "delete", path: "/api/user/profile-pic", auth: "authenticated" },
  { method: "get", path: "/api/user/me", auth: "authenticated" },

  // PayPal and AI
  { method: "post", path: "/api/paypal/create-order", auth: "authenticated" },
  { method: "post", path: "/api/paypal/capture-order", auth: "authenticated" },
  { method: "get", path: "/api/paypal/client-id", auth: "public" },
  {
    method: "post",
    path: "/api/ai/chat",
    auth: "authenticated",
    notes: "rate-limited (aiLimiter); any authenticated user",
  },

  // Search
  { method: "get", path: "/api/search", auth: "public" },
];

/** Mount-order invariants that must survive the migration. */
export const ORDERING_NOTES = [
  "`GET /api/quizzes/recommend` must remain registered before `GET /api/quizzes/:id`.",
  "`GET /api/dinosaurs/featured` must remain registered before `GET /api/dinosaurs/:id`.",
  "`GET /api/favorites/check/:dinoId` must remain registered before `DELETE /api/favorites/:dinoId`.",
] as const;

/** Stable unauthenticated error body from authMiddleware when Authorization is missing. */
export const NO_TOKEN_RESPONSE = { error: "No token provided" } as const;

export function contractKey(method: string, path: string): string {
  return `${method.toLowerCase()} ${path}`;
}

export function samplePathFor(entry: RouteContractEntry): string {
  return entry.samplePath ?? entry.path;
}

export function protectedRoutes(): RouteContractEntry[] {
  return ROUTE_CONTRACT.filter((entry) => entry.auth !== "public");
}

export function publicRoutes(): RouteContractEntry[] {
  return ROUTE_CONTRACT.filter((entry) => entry.auth === "public");
}
