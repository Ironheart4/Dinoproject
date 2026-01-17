# DinoProject — Developer Notes

Short, focused reference for developers working on DinoProject.

## Quick start (local)
- Backend:
  - Install: `npm install`
  - Generate Prisma client: `npx prisma generate`
  - Build: `npm run build` (or `npm run dev` for development)
  - Start: `npm start` (or `npm run dev` for tsc watch + nodemon)

- Frontend (monorepo `frontend/`):
  - `cd frontend && npm install && npm run dev`

- Seed DB (optional):
  - `npx ts-node scripts/seed.ts` (requires `DATABASE_URL` env var)

## Important Environment Variables
- Backend
  - `DATABASE_URL` — Postgres connection string (Supabase/Postgres)
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase public anon key
  - `SUPABASE_SERVICE_KEY` — Supabase service_role key (server-only, SECRET)
  - `JWT_SECRET` — (if used) JWT signing secret
  - `PORT` — server port (e.g., 10000 or provided by host)
  - `ALLOWED_ORIGINS` — comma-separated list of allowed frontend origins (CORS)
  - `HUGGINGFACE_API_KEY` — (optional) Hugging Face inference API key for AI DinoBot
  - `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` — PayPal configuration

- Frontend (Vite / Vercel)
  - `VITE_API_URL` — Backend base URL (e.g., `https://dinoproject-backend-xxxx.onrender.com`)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

> Security: never expose `SUPABASE_SERVICE_KEY` or PayPal secret on the frontend.

## Deploy notes
- Render (backend)
  - Use Build Command: `npm install --include=dev && npx prisma generate && npm run build`
  - Alternatively set `NPM_CONFIG_PRODUCTION=false` to include devDependencies during build
  - Ensure `DATABASE_URL`, Supabase keys, `ALLOWED_ORIGINS`, and `PORT` are set in Render env
  - Common issue: Missing `@types/*` used by TypeScript during build — include dev deps or use `--include=dev`

- Vercel (frontend)
  - Set `VITE_API_URL` to the Render URL after backend deploy
  - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Redeploy after changing environment variables

## Useful endpoints
- Health: `GET /health` → checks DB connectivity
- API root: `GET /` → simple JSON message
- Dinosaurs: `GET /api/dinosaurs`, `GET /api/dinosaurs/:id` (CRUD: POST/PUT/DELETE)
- Auth: `/api/auth/*` using Supabase tokens
- AI: `POST /api/ai/chat` (Premium / may require HF key)

## Troubleshooting tips
- CORS issues for 3D models: check model host for `Access-Control-Allow-Origin` header and use raw.githubusercontent for GitHub-hosted models.
- Render build errors: If TypeScript complains about missing declaration files, ensure devDependencies are installed during build (see `--include=dev`).
- Cold-start: Free Render instances may take ~30s on first request — show loading states on the frontend.

## Where to look in the code
- Backend main server: `server.ts` — middleware, routes (dino, auth, quizzes, AI, PayPal)
- Seed data: `scripts/seed.ts`
- Admin frontend: `admin/src` — admin dashboard, dinosaur/quizzes/users management
- Frontend key components:
  - 3D viewer: `frontend/src/components/DinoViewer.tsx`
  - AI assistant: `frontend/src/components/DinoAssistant.tsx`
  - Audio: `frontend/src/components/DinoSound.tsx`

## Conventions & notes
- Comments are added throughout the project to explain purpose and env usage.
- Use `VITE_API_URL` for production API base in the frontend; many places currently reference `http://localhost:5000` for local dev.

If you'd like, I can:
- Add a `CONTRIBUTING.md` with run/debug checklists (quick dev tasks), or
- Expand the notes with a short troubleshooting FAQ based on past deploy logs.

— GitHub Copilot (Raptor mini, Preview)