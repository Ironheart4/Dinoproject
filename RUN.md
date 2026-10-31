# Local Run Guide

DinoProject has a backend, a public frontend, and a separate private admin app.
The commands below are for local development and testing only.

## Prerequisites

- Node.js 22 (Node 18+ is supported by the project)
- npm
- Docker Desktop, if using the container workflow
- A working Supabase project for database-backed features

## Install dependencies

From the repository root:

```bash
npm install
cd frontend && npm install && cd ..
```

The admin app is a separate private repository. Clone it into `admin/` when needed,
then install its dependencies:

```bash
cd admin
npm install
cd ..
```

## Configure environment

Copy the example file and fill in local or staging values. Do not commit `.env`.

Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Required backend values include `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and exact `ALLOWED_ORIGINS`. Add PayPal, Hugging Face,
and Supabase Storage values only when those features are being tested.

## Prepare Prisma

Generate the client without connecting to the database:

```bash
npm run prisma:generate
```

After confirming that the configured database is reachable and the schema change has
been reviewed, apply the schema:

```bash
npx prisma db push
```

Do not run database commands against production from an agent workflow.

## Run development servers

Use separate terminals.

Backend on port 5000:

```bash
npm run dev
```

Public frontend on port 5173:

```bash
cd frontend
npm run dev
```

Admin app on port 5174:

```bash
cd admin
npm run dev
```

The admin Vite server proxies `/api` requests to `http://localhost:5000`.

## Test and verify

Backend typecheck, tests, and build:

```bash
npm run typecheck
npm test
npm run build
```

Full repository verification:

```bash
npm run verify
```

`npm run verify` uses Bash. On Windows, use Git Bash or enable WSL2. If Bash is
not available, run the individual npm commands above and build the clients:

```powershell
npm --prefix frontend run build
npm --prefix admin run build
```

The security smoke tests do not require a live database. Authenticated route behavior,
profile storage, subscriptions, and PayPal require configured test services.

## Docker

Validate Compose without starting services:

```bash
docker compose config --quiet
```

Build and start the backend and public frontend:

```bash
docker compose up --build -d
```

Check the backend health endpoint:

```bash
curl http://localhost:5000/health
```

PowerShell equivalent:

```powershell
Invoke-WebRequest http://localhost:5000/health
```

Stop the stack:

```bash
docker compose down
```

Docker uses the same environment variables as `.env`. The backend health check is
`/health`; it does not require the database to be available for the process to start,
but `/health/db` will report database connectivity separately.

## Production deployment checks

- Render uses `npm run build` and `node dist/server.js`.
- Render must contain the exact public and admin Vercel origins in `ALLOWED_ORIGINS`.
- The profile-pictures Supabase Storage bucket must exist before profile uploads are tested.
- Run `npx prisma db push` only after the Supabase connection is repaired and reviewed.
