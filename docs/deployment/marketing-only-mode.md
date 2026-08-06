# Marketing-Only Mode

A temporary deploy mode that serves **only the marketing pages** and closes off the app half of the site. Introduced so Lenzro could ship a public site while the API was still on a free tier that cold-starts.

**Introduced in:** commit `f40f389` — *"feat: marketing-only mode for cold-start deploys"*

---

## Why it exists

`AuthProvider` is mounted in the root layout, so it wraps **every** page — marketing included. On mount it calls `POST /auth/refresh` and renders a full-screen loader until that resolves ([auth-provider.tsx](../../apps/web/src/components/providers/auth-provider.tsx)).

Against an API that cold-starts, that request takes ~50s or hangs outright, and visitors to the homepage sit on a spinner. Marketing-only mode short-circuits the bootstrap so no page ever waits on the backend.

---

## What it does when enabled

| Area | Behaviour |
|------|-----------|
| `/auth`, `/onboarding`, `/workspace/*` | Redirect to `/` in middleware |
| Auth bootstrap | Skipped entirely — zero backend calls, no loader |
| Sign-up / log-in CTAs | Hidden in nav, hero and mobile menu |
| Session hint cookie | Never read |

Everything under `(marketing)` — `/`, `/pricing`, `/solutions`, `/docs` — renders as normal static content.

---

## The switch

```bash
NEXT_PUBLIC_MARKETING_ONLY="true"   # marketing only
NEXT_PUBLIC_MARKETING_ONLY="false"  # full app (also: unset)
```

Parsed in exactly one place, [`apps/web/src/config/app-mode.ts`](../../apps/web/src/config/app-mode.ts):

```ts
export const MARKETING_ONLY = process.env.NEXT_PUBLIC_MARKETING_ONLY === 'true';
```

> `NEXT_PUBLIC_*` values are **inlined at build time**. Changing this variable requires a redeploy — restarting the app is not enough.

---

## Reverting: turn it off

This is the launch-day path. It is a config change, no code edits.

1. **Vercel → Project → Settings → Environment Variables** → set `NEXT_PUBLIC_MARKETING_ONLY` to `false` (or delete the variable) for **Production**, and **Preview** if it was set there.
2. Confirm the app's real env vars are present and pointing at a live API — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`. Marketing-only mode was hiding the fact that these were unused.
3. **Deployments → ⋯ → Redeploy** on the current production deployment. Do *not* tick "use existing build cache" — the flag is baked into the bundle.
4. Verify: `/auth` loads instead of redirecting, "Get started" is visible in the nav, and a logged-in session lands on `/workspace/<slug>`.

If `/auth` still redirects home, the build predates the env var change. Redeploy again.

---

## Reverting: remove it entirely

Once the app has launched and the flag is dead weight, delete it. Four files import `MARKETING_ONLY`; each usage is a guard to unwrap, not logic to untangle.

| File | What to remove |
|------|----------------|
| [`src/config/app-mode.ts`](../../apps/web/src/config/app-mode.ts) | Delete the file |
| [`src/middleware.ts`](../../apps/web/src/middleware.ts) | Delete the `if (MARKETING_ONLY) { … }` block at the top of `middleware()` and its import |
| [`src/components/providers/auth-provider.tsx`](../../apps/web/src/components/providers/auth-provider.tsx) | Delete the early-return guard at the top of the `useEffect` and its import |
| [`src/components/layout/marketing-nav.tsx`](../../apps/web/src/components/layout/marketing-nav.tsx) | Unwrap the `{!MARKETING_ONLY && ( … )}` around the desktop CTA block |
| [`src/components/marketing/hero.tsx`](../../apps/web/src/components/marketing/hero.tsx) | Unwrap the guard around the "Launch your business" `<Link>` |
| [`src/components/marketing/mobilemenu.tsx`](../../apps/web/src/components/marketing/mobilemenu.tsx) | Unwrap the guard around the CTA block |

Then drop `NEXT_PUBLIC_MARKETING_ONLY` from [`.env.example`](../../apps/web/.env.example), your local `.env.local`, and the Vercel dashboard.

Sanity check that nothing was missed:

```bash
grep -rn "MARKETING_ONLY" apps/web/src apps/web/.env.example
```

**Do not** revert commit `f40f389` wholesale. It also fixed the mobile menu's "Log in" link, which pointed at `/login` — a route that does not exist in this app. Reverting reintroduces that 404.

---

## Known limitation

While enabled, there is no way to reach `/workspace` on the deployed URL — including for you. App development is local-only until the flag comes off. If you need a way in before launch, add a cookie-gated bypass to the middleware guard rather than flipping the flag per-deploy.
