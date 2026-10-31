import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import { parsePositiveInt, parseBoundedNumber } from "../middleware/validate";

export interface RouteDependencies {
  prisma: PrismaClient;
  supabase: SupabaseClient;
  authLimiter: RequestHandler;
  aiLimiter: RequestHandler;
  authMiddleware: RequestHandler;
  adminMiddleware: RequestHandler;
  upload?: any;
  supabaseStorage?: any;
  profileStorageBucket?: string;
}

export function createAuthRouter(deps: RouteDependencies): Router {
  const router = Router();
  const { prisma, supabase, upload, supabaseStorage, profileStorageBucket } = deps;
// AUTH ENDPOINTS (Supabase Auth)
// Register - creates user in Supabase Auth
router.post("/api/auth/register", deps.authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Store name in user metadata
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: "Registration failed" });
    }

    // Create user in our users table (linked to auth.users)
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        name,
        role: "user",
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: data.user.email,
      message: "Registration successful! Please check your email to verify your account."
    });
  } catch (error: any) {
    console.error("Register error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login - authenticates with Supabase Auth
router.post("/api/auth/login", deps.authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: "Login failed" });
    }

    // Get or create user in our users table
    let user = await prisma.user.findUnique({ where: { id: data.user.id } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          name: data.user.user_metadata?.name || email.split("@")[0],
          role: "user",
        },
      });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: data.user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout - invalidates Supabase session
router.post("/api/auth/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      // Sign out from Supabase
      await supabase.auth.signOut();
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Refresh token endpoint
router.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Get current user profile
router.get("/api/auth/me", deps.authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: req.user.email,
      role: user.role,
      createdAt: user.createdAt,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});


  return router;
}
