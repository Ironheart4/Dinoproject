// server.ts — DinoProject backend HTTP server
// CRITICAL: DNS fix must be FIRST before any imports to prevent IPv6 issues
import dns from "dns";
import { promisify } from "util";
dns.setDefaultResultOrder("ipv4first");

// Purpose: Provides the REST API for DinoProject and integrates:
//  - Supabase Auth (JWT verification)
//  - PostgreSQL via Prisma (PrismaPg adapter + pg Pool)
//  - File uploads (multer) and static uploads serving
//  - Security (helmet, CORS), logging (morgan), and rate limiting
// Quick tips:
//  - Set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables
//  - Set DATABASE_URL to your Postgres connection string (e.g., Supabase)
//  - Configure ALLOWED_ORIGINS to include your frontend domain(s) (Vercel URL)
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client setup
// - SUPABASE_URL: your Supabase project URL (from Supabase dashboard)
// - SUPABASE_ANON_KEY: public anon key used for client-side auth; do NOT publish service_role keys
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to resolve hostname to IPv4 address
const lookup4 = promisify(dns.lookup);
async function resolveToIPv4(connectionString: string): Promise<string> {
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    // Resolve to IPv4 only
    const result = await lookup4(hostname, { family: 4 });
    const ipv4Address = typeof result === 'string' ? result : result.address;
    // Replace hostname with IPv4 address in connection string
    url.hostname = ipv4Address;
    console.log(`Resolved ${hostname} to IPv4: ${ipv4Address}`);
    return url.toString();
  } catch (err) {
    console.error('Failed to resolve hostname to IPv4, using original:', err);
    return connectionString;
  }
}

// Prisma and Pool will be initialized after IPv4 resolution
let pool: Pool;
let adapter: PrismaPg;
let prisma: PrismaClient;

// Initialize database connection with IPv4 resolution
async function initDatabase() {
  const originalConnectionString = process.env.DATABASE_URL!;
  const connectionString = await resolveToIPv4(originalConnectionString);
  
  pool = new Pool({ connectionString });
  adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected pool error:', err);
  });
  
  console.log('Database connection initialized');
}

// Handle uncaught exceptions and unhandled promise rejections
// These handlers ensure unexpected runtime errors are logged for post-mortem debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Rate limiting - prevent brute force attacks
// Configure using env vars: RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX_REQUESTS
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
// This keeps login/register attempts low to reduce credential stuffing and brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/register attempts per windowMs
  message: { error: "Too many authentication attempts, please try again later." },
});

// CORS configuration - restrict origins in production
// Set ALLOWED_ORIGINS to a comma-separated list of allowed frontend domains (e.g., https://dinoproject.vercel.app)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow if origin is in the explicit list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview/production URLs
    if (origin.includes('vercel.app') || origin.includes('dinoproject')) {
      return callback(null, true);
    }
    // Allow in development mode
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
// Content Security Policy is deliberately permissive for fonts, images, and Supabase connections
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
  crossOriginEmbedderPolicy: false, // Allow loading 3D models
}));

// HTTP request logging (dev vs production) and request body parsing
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: "10mb" }));
app.use(limiter); // Apply rate limiting to all routes

// Serve uploaded files statically
// Uploaded files (e.g., profile pictures) are saved in the /uploads folder and served from /uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Multer configuration for profile picture uploads
// - Saves files to /uploads with a unique filename
// - Limits file size to 5MB and only accepts common image types
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files allowed (jpeg, jpg, png, webp, gif)"));
  },
});

// Auth middleware: verify Supabase JWT from Authorization header
// Steps:
// 1. Read Bearer token from Authorization header
// 2. Verify token with Supabase; if invalid, reject request
// 3. Ensure the user exists in the local 'users' table (create if missing)
// 4. Attach `req.user` with id, name, role and email for downstream handlers
async function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  
  try {
    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    // Get user from our users table (linked to auth.users)
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    
    // If user doesn't exist in our table yet, create them
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          role: "user",
        },
      });
    }
    
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
      email: user.email,
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Admin middleware: check if user is admin
// Expects `req.user` to be populated by `authMiddleware` and contains `role`
function adminMiddleware(req: any, res: any, next: any) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

// Health check: simple endpoint for hosting services
// Returns OK immediately - database connectivity is checked separately
app.get("/health", async (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database health check (separate endpoint for debugging)
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Database health check failed:", err);
    res.status(503).json({ status: "error", detail: String(err) });
  }
});

// Home
app.get("/", (_req, res) => {
  res.json({ message: "🦖 DinoProject Backend — READY TO ROAR! 🔥" });
});

// AUTH ENDPOINTS (Supabase Auth)
// Register - creates user in Supabase Auth
app.post("/api/auth/register", authLimiter, async (req, res) => {
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
app.post("/api/auth/login", authLimiter, async (req, res) => {
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
app.post("/api/auth/logout", async (req, res) => {
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
app.post("/api/auth/refresh", async (req, res) => {
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
app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
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

// DINOSAURS ENDPOINTS
app.get("/api/dinosaurs", async (_req, res) => {
  try {
    const dinos = await prisma.dinosaur.findMany({
      orderBy: { name: "asc" },
    });
    res.json(dinos);
  } catch (error) {
    console.error("Fetch dinos error:", error);
    res.status(500).json({ error: "Failed to fetch dinosaurs" });
  }
});

// GET featured dinosaurs (for homepage)
app.get("/api/dinosaurs/featured", async (_req, res) => {
  try {
    const featured = await prisma.dinosaur.findMany({
      where: {
        OR: [
          { imageUrl1: { not: undefined } },
          { modelUrl: { not: undefined } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    res.json(featured);
  } catch (error) {
    console.error("Fetch featured error:", error);
    res.status(500).json({ error: "Failed to fetch featured dinosaurs" });
  }
});

// CREATE a new dinosaur
app.post("/api/dinosaurs", async (req, res) => {
  try {
    const {
      name, species, period, diet, habitat, lengthMeters, weightKg, description,
      modelUrl, roarSound, imageUrl, imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5,
      videoUrl, taxonomy, type, livedIn, namedBy
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "'name' and 'species' are required" });
    }

    const dino = await prisma.dinosaur.create({
      data: {
        name,
        species,
        period: period ?? null,
        diet: diet ?? null,
        habitat: habitat ?? null,
        lengthMeters: lengthMeters ? parseFloat(lengthMeters) : null,
        weightKg: weightKg ? parseInt(weightKg) : null,
        description: description ?? null,
        modelUrl: modelUrl ?? null,
        roarSound: roarSound ?? null,
        imageUrl: imageUrl ?? null,
        imageUrl1: imageUrl1 ?? null,
        imageUrl2: imageUrl2 ?? null,
        imageUrl3: imageUrl3 ?? null,
        imageUrl4: imageUrl4 ?? null,
        imageUrl5: imageUrl5 ?? null,
        videoUrl: videoUrl ?? null,
        taxonomy: taxonomy ?? null,
        type: type ?? null,
        livedIn: livedIn ?? null,
        namedBy: namedBy ?? null,
      },
    });
    res.status(201).json(dino);
  } catch (error) {
    console.error("Create dino error:", error);
    res.status(500).json({ error: "Failed to create dinosaur" });
  }
});

// UPDATE a dinosaur by id
app.put("/api/dinosaurs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, species, period, diet, habitat, lengthMeters, weightKg, description,
      modelUrl, roarSound, imageUrl, imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5,
      videoUrl, taxonomy, type, livedIn, namedBy
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: "'name' and 'species' are required" });
    }

    const dino = await prisma.dinosaur.update({
      where: { id: parseInt(id) },
      data: {
        name,
        species,
        period: period ?? null,
        diet: diet ?? null,
        habitat: habitat ?? null,
        lengthMeters: lengthMeters ? parseFloat(lengthMeters) : null,
        weightKg: weightKg ? parseInt(weightKg) : null,
        description: description ?? null,
        modelUrl: modelUrl ?? null,
        roarSound: roarSound ?? null,
        imageUrl: imageUrl ?? null,
        imageUrl1: imageUrl1 ?? null,
        imageUrl2: imageUrl2 ?? null,
        imageUrl3: imageUrl3 ?? null,
        imageUrl4: imageUrl4 ?? null,
        imageUrl5: imageUrl5 ?? null,
        videoUrl: videoUrl ?? null,
        taxonomy: taxonomy ?? null,
        type: type ?? null,
        livedIn: livedIn ?? null,
        namedBy: namedBy ?? null,
      },
    });
    res.json(dino);
  } catch (error) {
    console.error("Update dino error:", error);
    res.status(500).json({ error: "Failed to update dinosaur" });
  }
});

// DELETE a dinosaur by id
app.delete("/api/dinosaurs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dinosaur.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete dino error:", error);
    res.status(500).json({ error: "Failed to delete dinosaur" });
  }
});

// GET a single dinosaur by id
app.get("/api/dinosaurs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dino = await prisma.dinosaur.findUnique({
      where: { id: parseInt(id) },
    });
    if (!dino) {
      return res.status(404).json({ error: "Dinosaur not found" });
    }
    res.json(dino);
  } catch (error) {
    console.error("Fetch dino error:", error);
    res.status(500).json({ error: "Failed to fetch dinosaur" });
  }
})

// QUIZZES ENDPOINTS
app.get("/api/quizzes", async (_req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({ include: { questions: true } });
    res.json(quizzes);
  } catch (error) {
    console.error("Fetch quizzes error:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

app.post("/api/quizzes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, questions } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const quiz = await prisma.quiz.create({
      data: {
        title,
        questions: {
          create: questions || [],
        },
      },
      include: { questions: true },
    });
    res.status(201).json(quiz);
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

app.delete("/api/quizzes/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

// GET single quiz by ID
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    console.error("Fetch quiz error:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// UPDATE quiz
app.put("/api/quizzes/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, questions } = req.body;
    
    // Delete existing questions and recreate
    await prisma.question.deleteMany({ where: { quizId: parseInt(id) } });
    
    const quiz = await prisma.quiz.update({
      where: { id: parseInt(id) },
      data: {
        title,
        questions: {
          create: questions || [],
        },
      },
      include: { questions: true },
    });
    res.json(quiz);
  } catch (error) {
    console.error("Update quiz error:", error);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

// GET random questions for quiz (frontend use)
app.get("/api/quiz/random", async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    
    // Get all questions from all quizzes
    const questions = await prisma.question.findMany({
      include: { quiz: { select: { title: true } } },
    });
    
    // Shuffle and take requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    res.json(selected);
  } catch (error) {
    console.error("Fetch random questions error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// SAVE quiz score
app.post("/api/scores", authMiddleware, async (req: any, res) => {
  try {
    const { quizId, score } = req.body;
    const userId = req.user.id;
    
    const savedScore = await prisma.score.create({
      data: {
        userId,
        quizId: quizId || 1, // Default to quiz 1 if random
        score,
      },
    });
    res.status(201).json(savedScore);
  } catch (error) {
    console.error("Save score error:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// GET user's quiz history
app.get("/api/scores/me", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
    });
    res.json(scores);
  } catch (error) {
    console.error("Fetch scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// USER MANAGEMENT ENDPOINTS (Admin only)
app.get("/api/users", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Map subscription data to flat structure for frontend
    const mappedUsers = users.map(user => ({
      ...user,
      subscriptionTier: user.subscription?.plan || 'free',
      subscriptionStatus: user.subscription?.status || 'active',
    }));
    res.json(mappedUsers);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
    res.json(user);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// ANALYTICS ENDPOINTS (Admin only)
app.get("/api/analytics", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get counts
    const [
      totalUsers,
      totalDinosaurs,
      totalQuizzes,
      premiumSubscribers,
      usersLast7Days,
      usersLast30Days,
      quizCompletions,
      recentScores,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.dinosaur.count(),
      prisma.quiz.count(),
      prisma.subscription.count({ where: { plan: "premium", status: "active" } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.score.count(),
      prisma.score.findMany({
        take: 100,
        orderBy: { completedAt: "desc" },
        include: { user: { select: { name: true } }, quiz: { select: { title: true } } },
      }),
    ]);

    // Get user registrations by day for the last 30 days
    const usersByDay = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Aggregate by date
    const dailyRegistrations: { [key: string]: number } = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyRegistrations[dateStr] = 0;
    }
    usersByDay.forEach((entry) => {
      const dateStr = new Date(entry.createdAt).toISOString().split("T")[0];
      if (dailyRegistrations[dateStr] !== undefined) {
        dailyRegistrations[dateStr]++;
      }
    });

    // Get subscription breakdown

    // Calculate free users (users without premium subscription)
    const freeUsers = totalUsers - premiumSubscribers;

    res.json({
      overview: {
        totalUsers,
        totalDinosaurs,
        totalQuizzes,
        premiumSubscribers,
        freeUsers,
        usersLast7Days,
        usersLast30Days,
        quizCompletions,
      },
      charts: {
        dailyRegistrations: Object.entries(dailyRegistrations).map(([date, count]) => ({
          date,
          count,
        })),
        subscriptionBreakdown: [
          { plan: "Free", count: freeUsers },
          { plan: "Premium", count: premiumSubscribers },
        ],
      },
      recentActivity: recentScores.slice(0, 10).map((s) => ({
        user: s.user.name,
        quiz: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ==================== FORUM ENDPOINTS ====================

// Get all forum categories
app.get("/api/forum/categories", async (_req, res) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { name: "asc" }
    });
    res.json(categories);
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get recent forum posts
app.get("/api/forum/posts/recent", async (_req, res) => {
  try {
    const posts = await prisma.forumPost.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { replies: true } }
      }
    });
    res.json(posts);
  } catch (error) {
    console.error("Fetch recent posts error:", error);
    res.status(500).json({ error: "Failed to fetch recent posts" });
  }
});

// Get posts by category
app.get("/api/forum/category/:slug", async (req, res) => {
  try {
    const category = await prisma.forumCategory.findUnique({
      where: { slug: req.params.slug },
      include: {
        posts: {
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          include: {
            user: { select: { id: true, name: true, role: true } },
            _count: { select: { replies: true } }
          }
        }
      }
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("Fetch category posts error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Get single post with replies
app.get("/api/forum/post/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Increment view count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    });
    
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    console.error("Fetch post error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create a new post (requires auth)
app.post("/api/forum/posts", authMiddleware, async (req: any, res) => {
  try {
    const { categoryId, title, content } = req.body;
    
    if (!categoryId || !title || !content) {
      return res.status(400).json({ error: "categoryId, title, and content are required" });
    }
    
    const post = await prisma.forumPost.create({
      data: {
        categoryId: parseInt(categoryId),
        userId: req.user.id,
        title,
        content
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, slug: true } }
      }
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Create a reply (requires auth)
app.post("/api/forum/posts/:id/replies", authMiddleware, async (req: any, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    const reply = await prisma.forumReply.create({
      data: {
        postId,
        userId: req.user.id,
        content
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });
    
    // Update reply count
    await prisma.forumPost.update({
      where: { id: postId },
      data: { replyCount: { increment: 1 } }
    });
    
    res.status(201).json(reply);
  } catch (error) {
    console.error("Create reply error:", error);
    res.status(500).json({ error: "Failed to create reply" });
  }
});

// SUBSCRIPTIONS ENDPOINTS
app.get("/api/subscription", authMiddleware, async (req: any, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });
    
    if (!subscription) {
      return res.json({ plan: "free", status: "active" });
    }
    
    // Check if donor subscription has expired (past endDate)
    if (subscription.plan === 'donor' && subscription.endDate) {
      const now = new Date();
      if (now > new Date(subscription.endDate)) {
        // Update status to expired if not already
        if (subscription.status !== 'expired') {
          await prisma.subscription.update({
            where: { userId: req.user.id },
            data: { status: 'expired' }
          });
        }
        return res.json({ ...subscription, status: 'expired', donorExpired: true });
      }
    }
    
    res.json(subscription);
  } catch (error) {
    console.error("Fetch subscription error:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

app.post("/api/subscription", authMiddleware, async (req: any, res) => {
  try {
    const { plan, paypalSubscriptionId } = req.body;
    if (!plan) return res.status(400).json({ error: "plan required" });
    
    const endDate = new Date();
    if (plan === "premium") {
      endDate.setMonth(endDate.getMonth() + 1); // 1 month for premium
    } else if (plan === "donor") {
      endDate.setMonth(endDate.getMonth() + 6); // 6 months for donor
    }
    
    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: { plan, status: "active", startDate: new Date(), endDate, paypalSubscriptionId },
      create: { userId: req.user.id, plan, status: "active", endDate, paypalSubscriptionId },
    });
    res.json(subscription);
  } catch (error) {
    console.error("Create subscription error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

app.delete("/api/subscription", authMiddleware, async (req: any, res) => {
  try {
    await prisma.subscription.update({
      where: { userId: req.user.id },
      data: { status: "cancelled" },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// FAVORITES ENDPOINTS
app.get("/api/favorites", authMiddleware, async (req: any, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { dinosaur: true },
    });
    res.json(favorites);
  } catch (error) {
    console.error("Fetch favorites error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Check if a dinosaur is favorited
app.get("/api/favorites/check/:dinoId", authMiddleware, async (req: any, res) => {
  try {
    const { dinoId } = req.params;
    const favorite = await prisma.favorite.findFirst({
      where: { userId: req.user.id, dinoId: parseInt(dinoId) },
    });
    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({ error: "Failed to check favorite" });
  }
});

app.post("/api/favorites", authMiddleware, async (req: any, res) => {
  try {
    const { dinoId, dinosaurId } = req.body;
    const id = dinoId || dinosaurId;
    if (!id) return res.status(400).json({ error: "dinoId or dinosaurId required" });
    
    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: { userId: req.user.id, dinoId: parseInt(id) },
    });
    if (existing) return res.status(200).json(existing);
    
    // Check user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });
    
    // Check if subscription is active (and for donor, not expired)
    let isPremiumOrActiveDonor = false;
    if (subscription && subscription.status === 'active') {
      if (subscription.plan === 'premium') {
        isPremiumOrActiveDonor = true;
      } else if (subscription.plan === 'donor' && subscription.endDate) {
        // Donor is active only if within 6-month window
        isPremiumOrActiveDonor = new Date() <= new Date(subscription.endDate);
      }
    }
    
    // Free users and expired donors can only have 5 favorites
    if (!isPremiumOrActiveDonor) {
      const currentCount = await prisma.favorite.count({
        where: { userId: req.user.id }
      });
      if (currentCount >= 5) {
        return res.status(403).json({ 
          error: "Free users can only save up to 5 favorites. Upgrade to unlock unlimited favorites!",
          limitReached: true
        });
      }
    }
    
    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, dinoId: parseInt(id) },
    });
    res.status(201).json(favorite);
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete("/api/favorites/:dinoId", authMiddleware, async (req: any, res) => {
  try {
    const { dinoId } = req.params;
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, dinoId: parseInt(dinoId) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// SCORES ENDPOINTS
app.post("/api/scores", authMiddleware, async (req: any, res) => {
  try {
    const { quizId, score } = req.body;
    if (!quizId || score === undefined) return res.status(400).json({ error: "quizId and score required" });
    const result = await prisma.score.create({
      data: { userId: req.user.id, quizId: parseInt(quizId), score: parseInt(score) },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Save score error:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

app.get("/api/scores", authMiddleware, async (req: any, res) => {
  try {
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    });
    res.json(scores);
  } catch (error) {
    console.error("Fetch scores error:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

// DASHBOARD ENDPOINTS

// Get comprehensive dashboard stats
app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    }) as any;
    
    // Get favorites count
    const favoritesCount = await prisma.favorite.count({
      where: { userId },
    });
    
    // Get quiz stats
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
    });
    
    const quizzesCompleted = scores.length;
    const highestScore = scores.length > 0 
      ? Math.max(...scores.map(s => s.score)) 
      : 0;
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;
    
    // Calculate activity streak (days since account creation)
    const createdAt = new Date(user?.createdAt || Date.now());
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        bio: user?.bio,
        profilePic: user?.profilePic,
        createdAt: user?.createdAt,
      },
      subscription: user?.subscription || { plan: "free", status: "active" },
      stats: {
        favoritesCount,
        quizzesCompleted,
        highestScore,
        averageScore,
        activityStreak: daysSinceCreated,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Get chart data for dashboard
app.get("/api/dashboard/charts", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get favorites with dinosaur details for charts
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
    });
    
    // Get quiz scores over time
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "asc" },
    });
    
    // Bar chart: Top 5 Dinosaur Types by favorites
    const typeCount: Record<string, number> = {};
    favorites.forEach(f => {
      const type = f.dinosaur.type || "Unknown";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const topTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    // Pie chart: Favorite Dino Diets
    const dietCount: Record<string, number> = {};
    favorites.forEach(f => {
      const diet = f.dinosaur.diet || "Unknown";
      dietCount[diet] = (dietCount[diet] || 0) + 1;
    });
    const diets = Object.entries(dietCount).map(([diet, count]) => ({ diet, count }));
    
    // Line chart: Quiz scores over time
    const quizProgress = scores.map(s => ({
      date: s.completedAt.toISOString().split("T")[0],
      score: s.score,
      quizTitle: s.quiz.title,
    }));
    
    res.json({
      topTypes,
      diets,
      quizProgress,
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Get recent activity
app.get("/api/dashboard/activity", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get all favorites with dates
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { dinosaur: true },
      orderBy: { createdAt: "desc" },
    });
    
    // Get all quiz scores
    const scores = await prisma.score.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { completedAt: "desc" },
    });
    
    res.json({
      favorites: favorites.map(f => ({
        id: f.id,
        dinosaurId: f.dinoId,
        dinosaurName: f.dinosaur.name || f.dinosaur.species,
        date: f.createdAt,
      })),
      quizzes: scores.map(s => ({
        id: s.id,
        quizId: s.quizId,
        quizTitle: s.quiz.title,
        score: s.score,
        date: s.completedAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard activity error:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Update user profile (name, bio)
app.put("/api/user/profile", authMiddleware, async (req: any, res) => {
  try {
    const { name, bio } = req.body;
    const userId = req.user.id;
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { 
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
      } as any,
    }) as any;
    
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      bio: updated.bio,
      profilePic: updated.profilePic,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Upload profile picture
app.post("/api/user/profile-pic", authMiddleware, upload.single("profilePic"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const userId = req.user.id;
    const profilePicUrl = `/uploads/${req.file.filename}`;
    
    // Delete old profile pic if exists
    const oldUser = await prisma.user.findUnique({ where: { id: userId } }) as any;
    if (oldUser?.profilePic) {
      const oldPath = path.join(uploadsDir, path.basename(oldUser.profilePic));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profilePic: profilePicUrl } as any,
    }) as any;
    
    res.json({
      profilePic: updated.profilePic,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Upload profile pic error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
});

// Delete profile picture
app.delete("/api/user/profile-pic", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get current user to find profile pic
    const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
    
    if (user?.profilePic) {
      // Delete file from disk
      const filePath = path.join(uploadsDir, path.basename(user.profilePic));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Clear profile pic in database
    await prisma.user.update({
      where: { id: userId },
      data: { profilePic: null } as any,
    });
    
    res.json({ message: "Profile picture removed successfully" });
  } catch (error) {
    console.error("Delete profile pic error:", error);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
});

// Get current user details
app.get("/api/user/me", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { subscription: true },
    }) as any;
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      subscription: user.subscription || { plan: "free", status: "active" },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});



// ==================== PAYPAL PAYMENT ENDPOINTS ====================

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("PayPal credentials not configured");
  }
  
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// Create PayPal order for subscription
app.post("/api/paypal/create-order", authMiddleware, async (req: any, res) => {
  try {
    const { plan } = req.body; // "premium_monthly", "premium_yearly", or "donor"
    
    let amount: string;
    let description: string;
    
    switch (plan) {
      case "premium_monthly":
        amount = "3.00";
        description = "DinoProject Premium - Monthly";
        break;
      case "premium_yearly":
        amount = "24.00";
        description = "DinoProject Premium - Yearly";
        break;
      case "donor":
        amount = req.body.amount || "5.00"; // Custom donor amount, minimum $5
        if (parseFloat(amount) < 5) amount = "5.00";
        description = "DinoProject Donor Support";
        break;
      default:
        return res.status(400).json({ error: "Invalid plan" });
    }
    
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description,
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription/success`,
          cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription`,
        },
      }),
    });
    
    const order = await response.json() as { id: string; links: Array<{ rel: string; href: string }>; error?: any };
    
    if (order.error) {
      console.error("PayPal create order error:", order);
      return res.status(500).json({ error: "Failed to create PayPal order" });
    }
    
    res.json({ 
      orderId: order.id,
      approvalUrl: order.links.find((l) => l.rel === "approve")?.href,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Capture PayPal order (after user approves)
app.post("/api/paypal/capture-order", authMiddleware, async (req: any, res) => {
  try {
    const { orderId, plan } = req.body;
    
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const captureData = await response.json() as { status: string; id: string };
    
    if (captureData.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }
    
    // Calculate expiry based on plan
    let expiresAt: Date;
    let subscriptionPlan: string;
    
    switch (plan) {
      case "premium_monthly":
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        subscriptionPlan = "premium";
        break;
      case "premium_yearly":
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
        subscriptionPlan = "premium";
        break;
      case "donor":
        expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
        subscriptionPlan = "donor";
        break;
      default:
        return res.status(400).json({ error: "Invalid plan" });
    }
    
    // Update or create subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });
    
    if (existingSub) {
      await prisma.subscription.update({
        where: { userId: req.user.id },
        data: {
          plan: subscriptionPlan,
          status: "active",
          expiresAt,
          paypalOrderId: orderId,
        } as any,
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: req.user.id,
          plan: subscriptionPlan,
          status: "active",
          expiresAt,
          paypalOrderId: orderId,
        } as any,
      });
    }
    
    res.json({ 
      success: true, 
      plan: subscriptionPlan,
      expiresAt,
      message: `Thank you! Your ${subscriptionPlan} subscription is now active.`,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// Get PayPal client ID for frontend
app.get("/api/paypal/client-id", (_req, res) => {
  if (!PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: "PayPal not configured" });
  }
  res.json({ clientId: PAYPAL_CLIENT_ID });
});

// ==================== AI DINO ASSISTANT (Hugging Face) ====================

// Hugging Face config: set HUGGINGFACE_API_KEY to enable the AI DinoBot.
// If the key is missing or the model is overloaded, the AI endpoint will gracefully fallback to `getLocalDinoResponse`.
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";

// Simple in-memory cache for repeated questions (lightweight)
const aiResponseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes cache
const MAX_CACHE_SIZE = 100; // Limit cache size for low RAM

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of aiResponseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      aiResponseCache.delete(key);
    }
  }
  // If still too large, remove oldest entries
  if (aiResponseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(aiResponseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => aiResponseCache.delete(key));
  }
}

// Normalize question for cache key
function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

// AI Chat endpoint - Premium users only
app.post("/api/ai/chat", authMiddleware, async (req: any, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Admins always have access
    const isAdmin = userRole === "admin";
    
    // Check if user is Premium or Donor (skip for admins)
    if (!isAdmin) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "active",
          plan: { in: ["premium", "donor"] },
        },
      });
      
      if (!subscription) {
        return res.status(403).json({ 
          error: "Premium required",
          message: "AI Assistant is available for Premium and Donor members only. Upgrade to access DinoBot!"
        });
      }
    }
    
    // Check cache first
    const cacheKey = normalizeQuestion(message);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ response: cached.response, cached: true });
    }
    
    // If no Hugging Face key, use fallback
    if (!HUGGINGFACE_API_KEY) {
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }
    
    // Build dinosaur-focused prompt for Flan-T5
    const prompt = buildDinoPrompt(message);
    
    // Call Hugging Face Inference API
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true,
        },
        options: {
          wait_for_model: true, // Wait if model is loading
        },
      }),
    });
    
    // Handle rate limiting
    if (response.status === 429) {
      console.warn("Hugging Face rate limit hit");
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse, rateLimited: true });
    }
    
    // Handle model loading
    if (response.status === 503) {
      const data = await response.json() as { error?: string; estimated_time?: number };
      if (data.error?.includes("loading")) {
        return res.status(503).json({ 
          error: "Model loading",
          message: "DinoBot is warming up! Please try again in a few seconds.",
          estimatedTime: data.estimated_time || 20
        });
      }
    }
    
    if (!response.ok) {
      console.error("Hugging Face API error:", response.status);
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }
    
    const data = await response.json() as Array<{ generated_text?: string }> | { generated_text?: string } | string;
    
    // Handle empty or invalid response
    let aiResponse = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      aiResponse = data[0].generated_text;
    } else if (typeof data === "string") {
      aiResponse = data;
    } else if (typeof data === "object" && "generated_text" in data && data.generated_text) {
      aiResponse = data.generated_text;
    }
    
    // If response is empty or too short, use fallback
    if (!aiResponse || aiResponse.trim().length < 10) {
      const fallbackResponse = await getLocalDinoResponse(message);
      return res.json({ response: fallbackResponse });
    }
    
    // Format and enhance the response
    const formattedResponse = formatDinoResponse(aiResponse, message);
    
    // Cache the response
    cleanCache();
    aiResponseCache.set(cacheKey, { response: formattedResponse, timestamp: Date.now() });
    
    res.json({ response: formattedResponse });
  } catch (error) {
    console.error("AI chat error:", error);
    const fallbackResponse = await getLocalDinoResponse(req.body.message || "");
    res.json({ response: fallbackResponse });
  }
});

// Build a dinosaur-focused prompt for Flan-T5
function buildDinoPrompt(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  // Specific prompts for common dinosaur questions
  if (msg.includes("t-rex") || msg.includes("tyrannosaurus")) {
    return `Answer this question about Tyrannosaurus Rex: ${userMessage}. Include facts about its size, diet, and when it lived.`;
  }
  
  if (msg.includes("velociraptor")) {
    return `Answer this question about Velociraptor: ${userMessage}. Mention it was actually turkey-sized with feathers.`;
  }
  
  if (msg.includes("biggest") || msg.includes("largest") || msg.includes("huge")) {
    return `What were the largest dinosaurs? Answer: ${userMessage}`;
  }
  
  if (msg.includes("smallest") || msg.includes("tiny")) {
    return `What were the smallest dinosaurs? Answer: ${userMessage}`;
  }
  
  if (msg.includes("when") || msg.includes("period") || msg.includes("era")) {
    return `Question about dinosaur time periods: ${userMessage}. Mention Triassic, Jurassic, or Cretaceous periods.`;
  }
  
  if (msg.includes("eat") || msg.includes("diet") || msg.includes("food")) {
    return `Question about dinosaur diets: ${userMessage}. Explain herbivore, carnivore, or omnivore diets.`;
  }
  
  if (msg.includes("extinct") || msg.includes("die") || msg.includes("asteroid")) {
    return `Why did dinosaurs go extinct? Answer: ${userMessage}`;
  }
  
  // General dinosaur question
  return `You are a dinosaur expert. Answer this question about dinosaurs or prehistoric life: ${userMessage}`;
}

// Format and enhance the AI response
function formatDinoResponse(aiResponse: string, originalQuestion: string): string {
  let response = aiResponse.trim();
  
  // Add emoji based on content
  const msg = originalQuestion.toLowerCase();
  if (msg.includes("t-rex") || msg.includes("carnivore") || msg.includes("meat")) {
    response = "🦖 " + response;
  } else if (msg.includes("sauropod") || msg.includes("long neck") || msg.includes("herbivore")) {
    response = "🦕 " + response;
  } else {
    response = "🦴 " + response;
  }
  
  // Add a helpful suffix occasionally
  if (!response.includes("Encyclopedia") && response.length < 200) {
    response += "\n\n💡 Explore our Encyclopedia to learn more!";
  }
  
  return response;
}

// Local fallback responses for dinosaur FAQs
// Local fallback for AI — uses the database to build short, helpful FAQ-style replies
// This runs when the external model is unavailable or returns empty/short responses
async function getLocalDinoResponse(message: string): Promise<string> {
  const msg = message.toLowerCase();
  
  // Try to find relevant dinosaur from database
  const dinos = await prisma.dinosaur.findMany({ take: 100 });
  const matchedDino = dinos.find(d => 
    (d.name && msg.includes(d.name.toLowerCase())) || 
    (d.species && msg.includes(d.species.toLowerCase()))
  );
  
  if (matchedDino) {
    return `🦕 **${matchedDino.name}** is a fascinating dinosaur! ${matchedDino.description || `It was a ${matchedDino.diet || 'dinosaur'} from the ${matchedDino.period || 'prehistoric era'}.`} Check out its page in our Encyclopedia to see the 3D model and learn more!`;
  }
  
  // General responses
  if (msg.includes("t-rex") || msg.includes("tyrannosaurus")) {
    return "🦖 **Tyrannosaurus Rex** was one of the largest land carnivores ever! With teeth up to 12 inches long and a bite force of over 12,000 pounds, T-Rex was the apex predator of the Late Cretaceous period (68-66 million years ago). It could grow up to 40 feet long and weigh 9 tons!";
  }
  
  if (msg.includes("velociraptor")) {
    return "🦖 **Velociraptor** was actually much smaller than shown in movies - about the size of a turkey (6 feet long, 2 feet tall)! They had feathers and were incredibly smart hunters from the Late Cretaceous period, living in what is now Mongolia.";
  }
  
  if (msg.includes("biggest") || msg.includes("largest")) {
    return "🦕 The **Argentinosaurus** is one of the largest dinosaurs ever discovered, estimated to be up to 100 feet long and weigh 70-100 tons! Other giants include Patagotitan and Dreadnoughtus. These sauropods were true titans of the prehistoric world.";
  }
  
  if (msg.includes("smallest")) {
    return "🐣 The **Microraptor** was one of the smallest dinosaurs, only about 2-3 feet long including its tail! It had four wings and could likely glide between trees. The Compsognathus was another tiny dino, about the size of a chicken.";
  }
  
  if (msg.includes("extinct") || msg.includes("die") || msg.includes("asteroid")) {
    return "☄️ Dinosaurs went extinct about 66 million years ago when a massive asteroid (about 6 miles wide) hit what is now Mexico's Yucatan Peninsula. The impact caused tsunamis, fires, and a 'nuclear winter' that blocked sunlight, killing about 75% of all species.";
  }
  
  if (msg.includes("period") || msg.includes("era") || msg.includes("when")) {
    return "🌍 Dinosaurs lived during the Mesozoic Era, divided into three periods:\n• **Triassic** (252-201 million years ago) - First dinosaurs appeared\n• **Jurassic** (201-145 million years ago) - Giant sauropods dominated\n• **Cretaceous** (145-66 million years ago) - T-Rex, Triceratops, and the extinction event";
  }
  
  if (msg.includes("eat") || msg.includes("diet") || msg.includes("food")) {
    return "🥬 Dinosaurs had three main diets:\n• **Herbivores** (plant-eaters) like Triceratops and Brachiosaurus\n• **Carnivores** (meat-eaters) like T-Rex and Velociraptor\n• **Omnivores** (both) like Ornithomimus\n\nSome herbivores ate up to 1,000 pounds of plants daily!";
  }
  
  if (msg.includes("quiz")) {
    return "🧠 Ready to test your dinosaur knowledge? Head over to our **Quiz** section! We have questions about dinosaur diets, time periods, sizes, and more. Can you get a perfect score?";
  }
  
  if (msg.includes("premium") || msg.includes("subscribe")) {
    return "⭐ **DinoProject Premium** gives you access to HD 3D models, unlimited favorites, AI DinoBot, and exclusive content! You can also become a **Donor** to support our mission. Check out the Subscription page!";
  }
  
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "👋 Hello, fellow dinosaur enthusiast! I'm DinoBot, your prehistoric guide! Ask me anything about dinosaurs - their diets, sizes, time periods, or specific species. What would you like to learn about today?";
  }
  
  if (msg.includes("fossil") || msg.includes("bone")) {
    return "🦴 Fossils are the preserved remains of ancient life! Dinosaur fossils form when bones are buried in sediment and minerals slowly replace the bone material over millions of years. The first dinosaur fossil was scientifically described in 1824!";
  }
  
  if (msg.includes("bird") || msg.includes("chicken")) {
    return "🐔 Yes, birds ARE dinosaurs! They evolved from small theropod dinosaurs during the Jurassic period. The closest living relatives of T-Rex are actually chickens and ostriches! So technically, dinosaurs never went fully extinct.";
  }
  
  // Default response
  return "🦕 Great question! I'm DinoBot, your dinosaur expert. I can tell you about:\n• Specific dinosaurs (T-Rex, Velociraptor, etc.)\n• Dinosaur diets and sizes\n• Time periods and extinction\n• Fossils and discoveries\n\nWhat would you like to know?";
}

// Start the HTTP server after initializing database
// Note: In production the service will bind to the port in process.env.PORT (Render/containers)
async function startServer() {
  try {
    await initDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📡 GET  → http://localhost:${PORT}/api/dinosaurs`);
      console.log(`🦖 POST → http://localhost:${PORT}/api/dinosaurs\n`);
    });

    // Keep server alive
    server.on('close', () => {
      console.log('Server closed');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        pool.end();
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();