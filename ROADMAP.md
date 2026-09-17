# Manasik — Build Roadmap

**The operating system for travel agencies.** Hajj & Umrah packages are one product line inside it, not the whole product.

Built for the agency, not the traveller: a serious internal tool — dense tables, fast flows, a clear "what needs doing today".

When in doubt, find the lowest unchecked box and work on that.

> The Spring Boot roadmap this replaces is archived at [`docs/reference/manasik-spring-roadmap.md`](docs/reference/manasik-spring-roadmap.md). Its lessons on RLS (roles that bypass it, testing it for real rather than reading the migration) still apply.

---

## Rules of engagement

1. **No `build`, `lint`, or `typecheck` runs without asking first.** Write the code, report what needs verifying, wait for the go-ahead.
2. **No phase skipping.** A phase isn't done until its checkpoint is ticked with a date.
3. **No landing page.** `/` → `/auth` → `/workspace`.
4. **UI is guided.** Yussuf supplies the design direction before any screen is built.
5. **Phases are planned together.** Yussuf walks through each phase before it starts; nothing below Phase 0 is detailed until then.
6. **Every decision gets written down here**, with the date.

---

## Decisions (2026-09-16)

These replace every decision in the archived roadmap (Flyway, Hibernate tenancy, Docker, OpenAPI type generation, memberships and roles).

| # | Decision | Choice | Why |
|---|---|---|---|
| **D1** | Stack | **Next.js 16 + Supabase** (Auth, Postgres, RLS). Spring Boot, Flyway, Redis and Docker are gone. | A separate API was too much for an MVP. Server Components + Server Actions talk to Supabase directly; RLS is the security boundary. |
| **D2** | Accounts | **One admin account. No organizations, no sign-up, no invites, no roles, no workspace switcher, no billing.** | One person uses it today. Everything that only matters with a second person is deferred, not designed around. |
| **D3** | Future multi-user | Every domain table carries **`agency_id uuid not null references auth.users(id)`**, set to the admin's `auth.uid()`. RLS: `using (agency_id = auth.uid())`. | Bringing on a second person later means adding `agencies` + `agency_members` and **swapping the policy** — no backfill, no data migration, because every row already holds the right value. |
| **D4** | Sessions | Supabase email + password via a **Server Action**. Tokens live only in **HttpOnly, Secure (prod), SameSite=Lax** cookies. `proxy.ts` refreshes the session on every request. **No browser Supabase client.** | JavaScript can never read the tokens, and you stay signed in on each device until you sign out. See "Auth, as built" below. |
| **D5** | Client state | No TanStack Query, no Zustand. | Server Components and Server Actions cover the MVP; one less thing to configure. |
| **D6** | Auth switched off for now | **`AUTH_ENABLED = false`** in `apps/web/src/features/auth/config.ts`. The app runs with no Supabase project: every request is let through, a placeholder "Admin" is the current user, "Log in" goes straight to the workspace, and the `signOut` action goes to `/auth`. The Log in / Sign up switch is back (`/auth?mode=signup`), but **sign-up is UI only and never creates an account** — with auth on it says sign-up isn't available. | Build the frontend first. The auth code from D4 stays in place and switches back on with that one flag — see "Turning auth back on" below. ⚠️ Never deploy real data with it off. |

---

## Auth, as built

> **Currently switched off (D6).** Everything below is wired and waiting; flipping `AUTH_ENABLED` to `true` turns it on.

| Piece | File | What it does |
|---|---|---|
| Cookie policy | `apps/web/src/lib/supabase/cookies.ts` | HttpOnly · Secure in production · SameSite=Lax · 400-day cookie |
| Server client | `apps/web/src/lib/supabase/server.ts` | Per-request client for Server Components / Actions / Route Handlers |
| Session refresh + gate | `apps/web/src/proxy.ts` → `lib/supabase/proxy.ts` | Refreshes expiring tokens; signed out → `/auth?next=…`; signed in on `/auth` → `/workspace` |
| Current user (DAL) | `apps/web/src/features/auth/session.ts` | `getCurrentUser()` / `requireUser()` — verifies the JWT with `getClaims()`, cached per render |
| Sign in / out | `apps/web/src/features/auth/actions.ts` | `signIn` validates with `@manasik/validations`, returns you to `?next=` (same-origin only). `signOut` ends **this device's** session only |
| UI access to the user | `apps/web/src/features/auth/current-user.tsx` | Workspace layout resolves the user on the server and hands it down via context |

**Security notes worth keeping in mind:**

- `getSession()` must never be used on the server to decide who someone is — it trusts the cookie without verifying it. Use `getClaims()` (or `getUser()`).
- The proxy is the optimistic gate, not the authority. Once real tables exist, **RLS decides what data comes back**. Every new table ships with RLS enabled and its policy in the same migration.
- The publishable key is public by design. **The secret key never goes in a `NEXT_PUBLIC_` variable.**

---

## Phase 0 — Align the repo for the MVP

- [x] Removed `apps/api` (Spring Boot) and its CI job / deploy workflow.
- [x] Removed the Spring auth client, in-memory token store, sign-up, email verification, onboarding, workspace switcher, plan badge, pricing and staff pages.
- [x] Routes flattened: `/workspace/[orgId]/…` → `/workspace/…`.
- [x] **Dashboard reset to zero (2026-09-16).** The mock workspace — sidebar, header, pilgrims / packages / bookings / groups / payments / documents / settings, mock data, data table, strings/money/date helpers, and the old spec docs — is removed. `/workspace` is a single blank page; the dashboard gets designed from scratch. Everything removed is recoverable from commit `90f3058`.
- [x] `@manasik/types`: dropped organization / membership / permission / user. `@manasik/validations`: down to `loginSchema`, now shipped as source. `@manasik/config`: dropped plans, token constants and the old env validator.
- [x] Supabase auth wired as described above. `zustand` removed; `@supabase/ssr` + `@supabase/supabase-js` added.
- [x] `.env.example`, CI, `.gitignore`, `.vscode` updated for the new stack.
- [x] Auth switched off for frontend work (D6).
- [ ] **Delete the leftover `apps/api` folder.** Windows file locks, plus the rule against deleting files git can't restore, meant only the git-tracked files were removed. What's left is untracked: `.env` (old database passwords and JWT secrets), `target/` and `.turbo/` build output. Nothing depends on it.

**Checkpoint 0** *(a run — Rule 1)*:

1. `pnpm install` is clean; `pnpm typecheck` passes.
2. `pnpm dev` → `/` opens the login page. No Supabase keys needed.
3. **Log in** (any email/password while auth is off) lands on the blank `/workspace` page.

> Branding note: the logo images and the Kaaba photo on the login page are unchanged — only the tagline now says "travel agencies".

---

## Turning auth back on — your to-do list (saved 2026-09-16)

Do these in order when it's time to add auth back.

### In Supabase

- [ ] **Old project cleanup.** The old Supabase project still has the `manasik` schema and `manasik_app` role from the Flyway setup. Drop them, or start a fresh project (simpler).
- [ ] **Turn OFF "Allow new users to sign up"** (Authentication → Sign In / Providers). ⚠️ This one matters: without it, anyone with the publishable key can create an account through the Supabase API, even though there's no sign-up page.
- [ ] **Create your admin user** (Authentication → Users → Add user) with **Auto Confirm**. Optionally set the display name:
  ```sql
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"full_name": "Your Name"}'
  where email = 'you@example.com';
  ```
- [ ] Check **JWT signing keys** are asymmetric (the default on new projects), so `getClaims()` verifies locally instead of calling the Auth server on every page.

### In the repo

- [ ] Put the **Project URL** and **publishable key** into `apps/web/.env.local` (see `.env.example`). Never the secret key.
- [ ] Set `AUTH_ENABLED = true` in `apps/web/src/features/auth/config.ts`.

### Auth checkpoint *(a run — Rule 1)*

1. Visiting `/workspace/bookings` signed out lands on `/auth?next=/workspace/bookings`; signing in returns you to bookings.
2. Wrong password → "Incorrect email or password."
3. DevTools → Application → Cookies: `sb-…-auth-token` is **HttpOnly**.
4. Close the browser, reopen `/` → straight into the workspace, no login.
5. Sign out → `/auth`; opening `/workspace` again redirects back to `/auth`. *(Needs a Log out button in the new dashboard wired to `signOut` from `features/auth/actions.ts`.)*

---

## Next phases — to be planned with Yussuf (Rule 5)

Order from the MVP plan; each gets detailed before it starts.

1. **Supabase schema foundations** — first domain table with `agency_id` + RLS, proven against a second test user. Open question: where Hajj & Umrah packages sit alongside clients and bookings.
2. **Clients (CRM)** — pipeline (new lead → contacted → quoted → booked → past client), client detail, notes.
3. **Suppliers + bookings** — confirmation status, and both payment flags: *client paid agency* and *agency paid supplier*.
4. **Trips** — group a client's bookings into a shareable itinerary / quote.
5. **Notifications** — event-triggered push first (webhook → Edge Function → Web Push), scheduled reminders via `pg_cron` after.
6. **PWA + mobile pass** — manifest, Serwist service worker, install prompt ("Add to Home Screen" is required for iOS push).

## Dev environment — to do later (saved 2026-09-16)

**Why:** edits often don't show until a hard refresh. Most likely cause: the repo lives inside OneDrive, which syncs and locks every file (including `node_modules` and `.next`) and can make Next's file watcher miss changes. The same locks made Windows refuse to move folders during the Phase 0 cleanup.

- [ ] Move the repo out of OneDrive, e.g. to `C:\dev\manasik`.
- [ ] Delete `apps/web/.next`.
- [ ] Run `pnpm install`, then `pnpm dev`.
- [ ] Add the project folder to the **Microsoft Defender exclusions** list (Windows Security → Virus & threat protection → Manage settings → Add or remove exclusions) — recommended by Next's own local-development guide.

If edits still need a hard refresh afterwards, check the browser console on save: "[Fast Refresh] performing full reload" means something in the code forces a reload; no message means changes aren't being detected. Remember that `.env.local`, `next.config.ts`, `proxy.ts` and newly installed packages always need a dev-server restart.

## Later (do not think about these yet)

Tasks · second user (`agencies` + `agency_members`, policy swap per D3) · billing · passkeys / MFA · password recovery screens · Resend email · Sentry · deployment (Vercel)