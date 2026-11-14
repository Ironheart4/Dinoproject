import type { CorsOptions } from "cors";

export function createCorsOptions(): CorsOptions {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ]).map((origin) => origin.trim()).filter(Boolean);

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}
