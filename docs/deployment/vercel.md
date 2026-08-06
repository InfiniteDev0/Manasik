# Vercel Deployment Guide

Lenzro's **Next.js web app** (`apps/web`) is deployed to Vercel. Vercel handles building, CDN distribution, preview deployments for pull requests, and automatic production deploys on merge to `main`.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [Monorepo Configuration](#monorepo-configuration)
- [Deploy Hooks and Workflow](#deploy-hooks-and-workflow)
- [Preview Deployments](#preview-deployments)
- [Custom Domain](#custom-domain)
- [Performance Settings](#performance-settings)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Vercel account at [vercel.com](https://vercel.com)
- The Vercel CLI: `npm i -g vercel`
- Lenzro repo pushed to GitHub (the Vercel GitHub App handles the rest)

---

## Project Setup

### Via Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Select the `lenzro` repository.
3. Set **Root Directory** to `apps/web`.
4. Set **Framework Preset** to **Next.js** (auto-detected).
5. Add all [environment variables](#environment-variables).
6. Click **Deploy**.

### Via CLI

```bash
cd apps/web
vercel link        # link to your Vercel account / team
vercel env add     # add required env vars (prompts you)
vercel deploy      # deploy preview
vercel deploy --prod  # deploy production
```

---

## Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**.
Mark variables as available in **Production**, **Preview**, and/or **Development** as appropriate.

| Variable                    | Example Value                            | Description                                  |
|-----------------------------|------------------------------------------|----------------------------------------------|
| `NEXT_PUBLIC_APP_URL`       | `https://app.lenzro.com`                 | Canonical app URL (used for OG tags, links)  |
| `NEXT_PUBLIC_API_URL`       | `https://api.lenzro.com/v1`              | REST API base URL (used in browser)          |
| `NEXT_PUBLIC_WS_URL`        | `wss://api.lenzro.com/realtime`          | WebSocket URL for real-time features         |
| `NEXTAUTH_URL`              | `https://app.lenzro.com`                 | NextAuth canonical URL (if using NextAuth)   |
| `NEXTAUTH_SECRET`           | `<random-secret>`                        | NextAuth session signing secret              |

> Prefix browser-accessible variables with `NEXT_PUBLIC_`. Server-only variables are never exposed to the client.

### Preview vs Production

Use Vercel's **Environment** selector to give preview deployments a different `NEXT_PUBLIC_API_URL` (e.g. pointing to your staging API) without touching production settings.

---

## Monorepo Configuration

Vercel has first-class monorepo support. Key settings for the `apps/web` project:

**`vercel.json`** (place in `apps/web/`):

```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

Alternatively, set these in the Vercel dashboard under **Settings → Build & Output Settings**:

| Setting           | Value                                              |
|------------------|----------------------------------------------------|
| Root Directory    | `apps/web`                                         |
| Build Command     | `cd ../.. && npx turbo run build --filter=web`     |
| Output Directory  | `.next`                                            |
| Install Command   | `npm install`                                      |
| Node.js Version   | `20.x`                                             |

### Turborepo Remote Cache on Vercel

Enable Vercel's built-in Turborepo remote cache to speed up builds:

1. Vercel dashboard → **Settings → Integrations → Turborepo**.
2. Enable **Vercel Remote Cache**.
3. No additional configuration needed — Vercel injects `TURBO_TOKEN` and `TURBO_TEAM` automatically.

---

## Deploy Hooks and Workflow

Automated deployments are handled by `.github/workflows/deploy-web.yml`:

| Trigger                 | Outcome                                                |
|------------------------|--------------------------------------------------------|
| Push to `main`          | Production deployment to `app.lenzro.com`             |
| Pull request opened     | Preview deployment with unique URL                    |
| PR updated              | New preview deployment, URL posted as PR comment      |
| PR merged and closed    | Preview deployment removed                            |
| Manual `workflow_dispatch` | Production deployment on demand                    |

Required GitHub secrets for the workflow:

```
VERCEL_TOKEN              # Vercel personal access token
VERCEL_ORG_ID             # Vercel team/org ID  (vercel env pull → check .vercel/project.json)
VERCEL_WEB_PROJECT_ID     # Vercel project ID for apps/web
```

---

## Preview Deployments

Every pull request gets a preview URL like:

```
https://lenzro-web-git-feature-my-branch-lenzroteam.vercel.app
```

The `deploy-web.yml` workflow posts this URL as a comment on the PR. Preview deployments:
- Use the **Preview** environment variables (can point to staging API).
- Are automatically cleaned up when the PR is merged or closed.
- Are password-protected by default if you enable Vercel's **Deployment Protection**.

---

## Custom Domain

1. Vercel dashboard → **Project → Settings → Domains**.
2. Add `app.lenzro.com`.
3. Vercel provides DNS records (CNAME or A). Add them in your DNS provider (Route 53, Cloudflare, etc.).
4. Vercel automatically provisions a Let's Encrypt TLS certificate.

For the `www` redirect: add `www.lenzro.com` → redirect to `app.lenzro.com`.

---

## Performance Settings

### Image Optimization

Next.js `<Image>` uses Vercel's image optimization. Add allowed image source domains in `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.lenzro.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};
```

### Edge Runtime

Consider using Next.js Edge Runtime for latency-sensitive middleware (auth checks, redirects). Set in route files:

```typescript
export const runtime = 'edge';
```

### ISR and Caching

- Public pages (`isPublic: true`) can use Incremental Static Regeneration (ISR) with `revalidate: 60`.
- Private workspace pages should use `dynamic = 'force-dynamic'` to prevent caching.

---

## Troubleshooting

| Problem                              | Fix                                                                     |
|--------------------------------------|-------------------------------------------------------------------------|
| Build fails with missing module      | Ensure all `@lenzro/*` package dependencies are declared in `apps/web/package.json` |
| `NEXT_PUBLIC_*` vars are undefined  | Variables must be set before the build — rebuild after adding them       |
| Turbo build skips changed packages   | Turbo cache may be stale; trigger a fresh build via Vercel dashboard     |
| Preview URL not posted on PR         | Check `VERCEL_TOKEN` secret and that the GitHub Actions workflow has `pull-requests: write` permission |
| `vercel.json` build command ignored  | If Root Directory is set in the dashboard, `vercel.json` buildCommand takes precedence; ensure consistency |
