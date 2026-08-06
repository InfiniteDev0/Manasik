# Railway Deployment Guide

[Railway](https://railway.app) is the simplest way to deploy the Lenzro **NestJS API** and **Redis** without managing infrastructure. Railway is ideal for staging environments and early-stage production workloads.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure on Railway](#project-structure-on-railway)
- [Deploy the API](#deploy-the-api)
- [Deploy Redis](#deploy-redis)
- [Environment Variables](#environment-variables)
- [Custom Domain](#custom-domain)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Scaling and Limits](#scaling-and-limits)
- [Monorepo Configuration](#monorepo-configuration)

---

## Prerequisites

- A Railway account at [railway.app](https://railway.app)
- Railway CLI: `npm i -g @railway/cli` then `railway login`
- Lenzro repo on GitHub
- A Neon PostgreSQL project (see [database.md](../architecture/database.md))

---

## Project Structure on Railway

Create one **Railway Project** called `lenzro` with three **services**:

```
lenzro (project)
├── api          ← NestJS API (apps/api), built from Docker or Nixpacks
├── redis        ← Redis 7 (Railway template)
└── (optional) web ← Next.js web app (or use Vercel)
```

---

## Deploy the API

### Option A: GitHub Repo (recommended)

1. Railway dashboard → **New Project → Deploy from GitHub Repo**.
2. Select the `lenzro` repository.
3. Railway auto-detects the Dockerfile or falls back to Nixpacks.
4. Set the **Root Directory** to `apps/api` (Settings → Source → Root Directory).
5. Set the **Start Command** (if not in Dockerfile): `node dist/main.js`
6. Add all [environment variables](#environment-variables).

### Option B: Railway CLI

```bash
cd apps/api
railway link          # link to your Railway project
railway up            # deploy
```

### Dockerfile (apps/api)

If `apps/api` has a `Dockerfile`, Railway uses it automatically. Example:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api ./apps/api
COPY packages ./packages
COPY tsconfig.json ./
RUN npm ci
RUN npx turbo run build --filter=api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

---

## Deploy Redis

1. Railway dashboard → inside your `lenzro` project → **New Service → Database → Redis**.
2. Railway provisions a Redis 7 instance.
3. Click the Redis service → **Variables** → copy `REDIS_URL`.
4. Paste `REDIS_URL` into the `api` service variables (Railway resolves inter-service references automatically if you use `${{Redis.REDIS_URL}}`).

---

## Environment Variables

Set these in Railway → `api` service → **Variables**:

| Variable               | Value                                              |
|-----------------------|----------------------------------------------------|
| `NODE_ENV`            | `production`                                       |
| `PORT`                | `4000`                                             |
| `DATABASE_URL`        | Neon pooled connection string                      |
| `DIRECT_URL`          | Neon direct connection string                      |
| `ACCESS_TOKEN_SECRET` | Random 256-bit string                              |
| `REFRESH_TOKEN_SECRET`| Random 256-bit string                              |
| `REDIS_URL`           | `${{Redis.REDIS_URL}}` (auto-resolved by Railway)  |
| `CORS_ORIGIN`         | `https://app.lenzro.com`                           |
| `S3_BUCKET`           | Your S3 bucket name                                |
| `S3_REGION`           | `us-east-1`                                        |
| `AWS_ACCESS_KEY_ID`   | IAM user access key (S3 write permissions)         |
| `AWS_SECRET_ACCESS_KEY`| IAM user secret key                              |
| `CDN_URL`             | `https://cdn.lenzro.com`                           |

> Generate secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Shared Variables

Use Railway's **Shared Variables** (project-level) for values used across multiple services (e.g. `DATABASE_URL`).

---

## Custom Domain

1. Railway → `api` service → **Settings → Networking → Custom Domain**.
2. Enter `api.lenzro.com`.
3. Add the provided CNAME record in your DNS provider.
4. Railway provisions TLS automatically.

Railway also provides a generated subdomain (`api-lenzro-production.up.railway.app`) — useful for smoke tests before pointing real DNS.

---

## CI/CD with GitHub Actions

The `.github/workflows/deploy-api.yml` workflow can trigger Railway deployments via the Railway API:

```yaml
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    RAILWAY_SERVICE_ID: ${{ secrets.RAILWAY_SERVICE_ID }}
  run: |
    npx @railway/cli up --service $RAILWAY_SERVICE_ID --detach
```

Required GitHub secrets:

```
RAILWAY_TOKEN         # Railway API token (Account Settings → Tokens)
RAILWAY_SERVICE_ID    # The UUID of the `api` service (found in service settings URL)
```

Alternatively, Railway auto-deploys on every push to `main` when linked to GitHub — no extra workflow step needed.

---

## Scaling and Limits

| Plan         | vCPU      | RAM      | Notes                                       |
|-------------|-----------|----------|---------------------------------------------|
| Hobby       | Shared    | 512 MB   | Free tier; sleeps on inactivity             |
| Pro         | Up to 8   | Up to 8 GB | Always-on; suitable for staging and low-traffic prod |
| Team        | Up to 32  | Up to 32 GB | Horizontal scaling, higher limits          |

For production with significant traffic, consider the AWS deployment instead (see [aws.md](./aws.md)).

Railway does **not** support horizontal scaling with WebSockets out of the box — Socket.IO sticky sessions require a Pro plan with multiple replicas + the Redis adapter configured (already set up in Lenzro's realtime module).

---

## Monorepo Configuration

Because Railway's `Root Directory` is set to `apps/api`, it only sees that folder's context. The Dockerfile must copy the necessary monorepo packages. Example build context approach:

**`railway.toml`** (place in repo root):

```toml
[build]
builder = "dockerfile"
dockerfilePath = "apps/api/Dockerfile"

[deploy]
startCommand = "node dist/main.js"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

This tells Railway to use the Dockerfile from `apps/api` but build from the monorepo root, giving the Docker build context access to all `packages/*`.
