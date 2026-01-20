// prisma.config.ts — Prisma configuration for DinoProject
// Notes:
// - Reads `DATABASE_URL` from environment; used by Prisma CLI for generation and migration tasks
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),  // Your .env DB connection lives here now
  },
});