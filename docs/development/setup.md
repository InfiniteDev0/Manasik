# Local Development Setup

This guide gets you from zero to a fully running Lenzro development environment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone and Install](#clone-and-install)
- [Environment Variables](#environment-variables)
- [Database Setup (Neon)](#database-setup-neon)
- [Running the Monorepo](#running-the-monorepo)
- [Running Individual Apps](#running-individual-apps)
- [Useful Scripts](#useful-scripts)
- [Editor Setup (VS Code)](#editor-setup-vs-code)
- [Common Issues](#common-issues)

---

## Prerequisites

| Tool        | Version  | Install                                       |
|------------|----------|-----------------------------------------------|
| Node.js    | ≥ 20.x   | [nodejs.org](https://nodejs.org) or `nvm`     |
| npm        | ≥ 10.x   | Comes with Node.js                            |
| Git        | ≥ 2.40   | [git-scm.com](https://git-scm.com)            |
| Docker     | Optional | Only needed to run the API in a container locally |

Verify your versions:

```bash
node --version    # v20.x.x
npm --version     # 10.x.x
```

---

## Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/lenzro.git
cd lenzro

# Install all dependencies (npm workspaces installs everything at once)
npm install
```

This installs dependencies for all packages and apps in one step. After this, all `@lenzro/*` internal packages are symlinked into `node_modules` and available to each app.

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
# ── Database (Neon) ────────────────────────────────────────────────
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.neon.tech/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require"

# ── App URLs ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000/v1"
NEXT_PUBLIC_WS_URL="ws://localhost:4000/realtime"

# ── Auth ───────────────────────────────────────────────────────────
ACCESS_TOKEN_SECRET="dev-access-secret-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"

# ── Redis (optional locally, uses in-memory fallback in dev) ───────
# REDIS_URL="redis://localhost:6379"
```

Each app and package may also need its own `.env.local` file — see the app-specific README.

---

## Database Setup (Neon)

Lenzro uses [Neon](https://neon.tech) for PostgreSQL. You need a free Neon account.

### 1. Create a Neon project

1. Go to [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Name it `lenzro-dev`, choose a region close to you.
3. Copy the **Connection string** (pooled) → paste as `DATABASE_URL`.
4. Copy the **Direct connection string** → paste as `DIRECT_URL`.

### 2. Run migrations

```bash
cd packages/database

# Generate Prisma client from the schema
npm run db:generate

# Run all pending migrations against your Neon database
npm run db:migrate
```

### 3. Seed sample data (optional)

```bash
npm run db:seed
```

This creates 3 users (alice, bob, carol), 1 workspace, and some sample pages.

### 4. Open Prisma Studio (visual DB browser)

```bash
npm run db:studio
# Opens http://localhost:5555
```

---

## Running the Monorepo

From the repo root, start all apps in development mode simultaneously:

```bash
npm run dev
```

Turborepo runs `dev` tasks in parallel for all apps. You'll see output from both `apps/web` and `apps/api` interleaved. Press `Ctrl+C` to stop everything.

| App           | URL                          |
|--------------|------------------------------|
| Web (Next.js) | http://localhost:3000        |
| API (NestJS)  | http://localhost:4000        |
| API Swagger   | http://localhost:4000/docs   |

---

## Running Individual Apps

If you only want to run one app:

```bash
# Web app only
npx turbo run dev --filter=web

# API only
npx turbo run dev --filter=api

# A single package in watch mode
npx turbo run build --filter=@lenzro/types --watch
```

---

## Useful Scripts

Run from the **repo root** unless otherwise noted.

| Command                       | Description                                        |
|------------------------------|----------------------------------------------------|
| `npm run dev`                 | Start all apps in development mode                 |
| `npm run build`               | Build all apps and packages (production)           |
| `npm run lint`                | ESLint all packages                                |
| `npm run type-check`          | TypeScript type-check all packages                 |
| `npm run format`              | Prettier format all files                          |
| `npm test`                    | Run all tests                                      |

**Database scripts** (run from `packages/database`):

| Command                       | Description                                        |
|------------------------------|----------------------------------------------------|
| `npm run db:generate`         | Regenerate Prisma client after schema changes      |
| `npm run db:migrate`          | Create and run a new migration                     |
| `npm run db:migrate:deploy`   | Apply pending migrations (production/CI)           |
| `npm run db:push`             | Push schema to DB without creating migration files (proto only) |
| `npm run db:studio`           | Open Prisma Studio at localhost:5555               |
| `npm run db:seed`             | Run the seed script                                |
| `npm run db:reset`            | Drop all tables, re-migrate, re-seed (⚠️ destructive) |

---

## Editor Setup (VS Code)

Recommended extensions (`.vscode/extensions.json`):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Common Issues

### `Cannot find module '@lenzro/*'`

Run `npm install` from the repo root. The `@lenzro/*` packages are symlinked via npm workspaces.

### Prisma client not generated

```bash
cd packages/database
npm run db:generate
```

This must be run once after cloning and after any changes to `schema.prisma`.

### `Cannot find name 'process'` or `'console'`

Ensure `@types/node` is installed at the root:

```bash
npm install --save-dev @types/node
```

### Port already in use

Kill the process using the port:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Database connection errors

- Check that `.env` is at the repo root and `DATABASE_URL` / `DIRECT_URL` are correct.
- Neon pauses free projects after inactivity — visit the Neon console to wake it up.
- Ensure your IP is not blocked by any Neon IP allowlist (disabled by default).
