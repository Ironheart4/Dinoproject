# DinoProject Migration Guide: Windows + Xubuntu 24.04

This guide moves local DinoProject development to Xubuntu 24.04 while keeping the existing Windows computer usable. The public backend repository and private admin repository remain separate Git repositories.

## 1. Target Layout

Use this layout on Xubuntu:

```text
~/Projects/Dinoproject/              public repository
~/Projects/Dinoproject/admin/        private admin repository
```

The `admin/` directory is a separate private Git repository checked out inside the public repository. Do not initialize a new Git repository in the public root, and do not commit the private admin repository from the public repository.

## 2. Prepare Xubuntu

Update the operating system:

```bash
sudo apt update
sudo apt full-upgrade -y
```

Install basic tools:

```bash
sudo apt install -y git curl ca-certificates build-essential unzip jq
```

Optional but useful for development:

```bash
sudo apt install -y libssl-dev pkg-config
```

Configure Git identity. Use the same identity as the Windows machine if you want commits to appear consistently:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

Check the configuration:

```bash
git config --global --list
```

## 3. Configure GitHub Authentication

### Recommended: SSH

Create an SSH key on Xubuntu:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Accept the default path. Start the agent and add the key:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Print the public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

Add that public key to GitHub under **Settings -> SSH and GPG keys**. Do not share the private file `~/.ssh/id_ed25519`.

Test access:

```bash
ssh -T git@github.com
```

You should receive GitHub’s authenticated greeting.

### HTTPS alternative

You may clone over HTTPS, but GitHub requires a personal access token instead of an account password when pushing. Avoid putting tokens directly in clone URLs or shell history.

## 4. Clone the Public Repository

Create the workspace and clone the public repository:

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone git@github.com:Ironheart4/Dinoproject.git Dinoproject
cd ~/Projects/Dinoproject
```

Confirm the public remote and branch:

```bash
git remote -v
git branch --show-current
git status
```

The public repository should be clean immediately after cloning.

## 5. Clone the Private Admin Repository

From the public repository root, clone the private admin repository into the exact `admin/` directory:

```bash
cd ~/Projects/Dinoproject
git clone git@github.com:Ironheart4/Dinoproject-admin.git admin
```

Verify that it is a separate repository:

```bash
cd admin
git remote -v
git status
cd ..
```

Check both repository roots:

```bash
git -C ~/Projects/Dinoproject rev-parse --show-toplevel
git -C ~/Projects/Dinoproject/admin rev-parse --show-toplevel
```

The two commands must return different directories. Work on public files from `~/Projects/Dinoproject` and admin files from `~/Projects/Dinoproject/admin`.

## 6. Install Node.js

The project is tested with Node 22. Install Node Version Manager:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Reload the shell:

```bash
source ~/.bashrc
```

Install and select Node 22:

```bash
nvm install 22
nvm alias default 22
nvm use 22
```

Verify versions:

```bash
node --version
npm --version
```

Node should report version 22.x.

## 7. Install Public Backend Dependencies

From the public repository root:

```bash
cd ~/Projects/Dinoproject
npm ci
```

Generate Prisma Client without contacting Supabase:

```bash
npm run prisma:generate
```

Do not run `npm install` in place of `npm ci` when reproducing the repository exactly. Use `npm install` only when intentionally changing dependencies and then commit the updated lockfile.

## 8. Install Public Frontend Dependencies

```bash
cd ~/Projects/Dinoproject/frontend
npm ci
```

The public frontend runs on port 5173.

## 9. Install Private Admin Dependencies

```bash
cd ~/Projects/Dinoproject/admin
npm install
```

Use the admin repository’s own lockfile and branch policy. Do not add admin files to the public repository commit.

The admin app runs on port 5174 and proxies local `/api` requests to the backend on port 5000.

## 10. Copy Environment Configuration Safely

Never commit `.env` files or paste secrets into chat. The environment files must be created separately on Xubuntu.

From the public repository root:

```bash
cd ~/Projects/Dinoproject
cp .env.example .env
chmod 600 .env
```

Edit the file locally:

```bash
nano .env
```

At minimum, configure the backend values required by the current deployment:

```env
DATABASE_URL="..."
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."
SUPABASE_PROFILE_BUCKET="profile-pictures"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"
FRONTEND_URL="http://localhost:5173"
PORT=5000
NODE_ENV=development
```

Add PayPal and Hugging Face variables only when those features are being tested:

```env
PAYPAL_CLIENT_ID="..."
PAYPAL_SECRET="..."
PAYPAL_MODE="sandbox"
HUGGINGFACE_API_KEY="..."
```

Protect the file:

```bash
chmod 600 .env
```

For the public frontend, create its local environment file:

```bash
cd ~/Projects/Dinoproject/frontend
cp .env.example .env.local 2>/dev/null || touch .env.local
chmod 600 .env.local
nano .env.local
```

Configure:

```env
VITE_API_URL="http://localhost:5000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
```

For the private admin repository:

```bash
cd ~/Projects/Dinoproject/admin
touch .env.local
chmod 600 .env.local
nano .env.local
```

Configure:

```env
VITE_API_URL="http://localhost:5000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
```

The public frontend and admin app should use the same Supabase project as the backend. The backend must use the matching project URL and anonymous key. Never put `SUPABASE_SERVICE_KEY` in either frontend environment file.

## 11. Database Preparation

First confirm that the database connection is available. The project’s Prisma CLI reads `DATABASE_URL` from `.env`:

```bash
cd ~/Projects/Dinoproject
npx prisma validate
npm run prisma:generate
```

When the Supabase database is reachable and the schema change has been reviewed:

```bash
npx prisma db push
```

Do not run `db push` against production casually. Back up or review the database first. If the pooler reports a tenant/user error, copy a fresh Session Pooler URL from Supabase **Connect** and replace `DATABASE_URL` locally.

The current schema includes profile fields, Wikipedia URLs, subscriptions, PayPal orders, quizzes, scores, favorites, and forum tables.

## 12. Run the Backend Locally

Open terminal 1:

```bash
cd ~/Projects/Dinoproject
npm run dev
```

The backend should listen on port 5000.

Check health from another terminal:

```bash
curl -i http://localhost:5000/health
curl -i http://localhost:5000/health/db
```

`/health` confirms the process is running. `/health/db` checks the database connection.

## 13. Run the Public Frontend

Open terminal 2:

```bash
cd ~/Projects/Dinoproject/frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

The public frontend must use `VITE_API_URL=http://localhost:5000` for local API requests.

## 14. Run the Private Admin App

Open terminal 3:

```bash
cd ~/Projects/Dinoproject/admin
npm run dev
```

Open:

```text
http://localhost:5174
```

The admin Vite proxy sends `/api` requests to the local backend. The admin login also calls the backend `/api/auth/me` endpoint to verify the local database role. The account must have `role = 'admin'` in `public.users`.

## 15. Run Tests and Builds

From the public repository root:

```bash
cd ~/Projects/Dinoproject
npm run typecheck
npx vitest run tests --reporter=verbose
npm run build
```

Build both client applications:

```bash
npm --prefix frontend run build
npm --prefix admin run build
```

The repository verification command uses Bash:

```bash
npm run verify
```

On Xubuntu this should run normally. It performs backend typechecking, tests, builds, and client builds. It may skip the local-only API-reference check when that file is not present in the checkout.

## 16. Docker Development

Confirm Docker is installed:

```bash
docker --version
docker compose version
```

Validate Compose without starting services:

```bash
cd ~/Projects/Dinoproject
docker compose config --quiet
```

Build and start the backend and public frontend:

```bash
docker compose up --build -d
```

Check service status and backend health:

```bash
docker compose ps
curl -i http://localhost:5000/health
```

View logs:

```bash
docker compose logs -f backend
```

Stop the stack:

```bash
docker compose down
```

The admin Vite app is not built by the public Docker Compose frontend service. Run it with `npm run dev` from the separate `admin/` repository when needed.

## 17. Keep Windows and Xubuntu in Sync

Use Git as the source of synchronization, not copied `node_modules` or copied build folders.

On Windows before switching machines:

```powershell
git status
git add <intended-files>
git commit -m "Describe the change"
git push origin main
```

On Xubuntu:

```bash
cd ~/Projects/Dinoproject
git pull --ff-only origin main
cd admin
git pull --ff-only origin main
```

After working on Xubuntu:

```bash
cd ~/Projects/Dinoproject
git status
git add <intended-files>
git commit -m "Describe the change"
git push origin main

cd admin
git status
git add <intended-files>
git commit -m "Describe the admin change"
git push origin main
```

Then update Windows with `git pull --ff-only` in each repository.

Do not commit:

- `.env` or `.env.local`
- `node_modules/`
- `dist/`, `frontend/dist/`, or `admin/dist/`
- local uploads
- local Claude or agent configuration

## 18. Troubleshooting

### Admin login returns CORS errors

Check that the Render `ALLOWED_ORIGINS` value contains the exact admin origin with no trailing slash, and that the admin Vercel build has the correct `VITE_API_URL`.

### Admin login returns 503 from `/api/auth/me`

The backend token may be valid but the local user/database lookup failed. Check Render logs and `/health/db`. Confirm the Supabase schema contains `users.bio`, `users.profile_pic`, and the current Prisma fields.

### Prisma reports a pooler tenant error

Use a fresh Supabase Session Pooler connection string from the project’s Connect dialog. URL-encode special characters in the database password.

### Frontend shows a blank or error page

Check the browser Network tab for `/api` requests, confirm `VITE_API_URL`, then check the backend `/health` endpoint and backend logs.

### Docker backend starts but database features fail

The container can pass `/health` while `/health/db` fails. Verify `DATABASE_URL` is available to Compose and points to the intended Supabase database.

## 19. Final Migration Checklist

- [ ] Xubuntu has Node 22 selected with nvm.
- [ ] Public repository cloned into `~/Projects/Dinoproject`.
- [ ] Private admin repository cloned into `~/Projects/Dinoproject/admin`.
- [ ] Git remotes and identities verified in both repositories.
- [ ] Root, frontend, and admin dependencies installed.
- [ ] `.env`, `frontend/.env.local`, and `admin/.env.local` created locally and protected.
- [ ] Supabase URL and public keys match across all applications.
- [ ] `npx prisma validate` passes.
- [ ] Database connection verified with `/health/db`.
- [ ] Backend, public frontend, and admin app run locally.
- [ ] Backend tests and all three production builds pass.
- [ ] Docker Compose validates and the backend health check responds.
- [ ] Windows and Xubuntu changes are synchronized through Git.
