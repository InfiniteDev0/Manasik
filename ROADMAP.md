<!-- # Manasik — Build Roadmap

**The Operating System for Hajj & Umrah Agencies.**

We build **backend-first**, one phase at a time. **Do not start a phase before the previous one is checkpointed.** When in doubt, find the lowest unchecked box and work on that.

---

## Rules of engagement

1. **No `build`, `lint`, or `typecheck` runs without asking first.** Write the code, report what needs verifying, wait for the go-ahead.
2. **No phase skipping.** Each phase ends in a **Checkpoint**. A phase isn't done until its checkpoint is a green check with a date.
3. **No landing page.** Auth → onboarding → workspace. Marketing site comes later, if ever.
4. **UI is guided.** Yussuf supplies the design direction before any screen is built. No inventing layouts.
5. **Every decision gets written down here**, in the phase where it happened, with the date.

---

## Locked decisions (2026-08-06)

These four were decided up front because they shape everything downstream. Treat them as settled.

| # | Decision | Choice | Why |
|---|---|---|---|
| **D1** | Schema ownership | **Flyway owns the schema.** `packages/database` (Prisma) is deleted. | Two migration tools cannot both own a database. Flyway SQL is the single source of truth; JPA entities map onto it. |
| **D2** | Tenant isolation | **Shared schema + `agency_id` + Hibernate `@TenantId` + Postgres RLS.** | Hibernate auto-stamps writes and auto-filters reads from a request-scoped tenant context resolved from the **JWT** (never a client header). RLS is the database-level backstop so even hand-written SQL can't leak across agencies. |
| **D3** | Local infrastructure | **Docker Desktop** + `docker-compose` (Postgres 17, Redis 7). | Prod parity locally, and it unlocks **Testcontainers** for real-Postgres integration tests. |
| **D4** | Frontend API types | **Generated from OpenAPI.** springdoc emits the spec from Java DTOs → `openapi-typescript` → `packages/types`. | Backend renames a field and the frontend fails to *compile* instead of failing in production. Zod schemas stay hand-written for form UX. |

### Version research (verified 2026-08-06)

- **Spring Boot 4.1.0** (released 2026-06-10) — baseline is **Java 17**, so the installed Temurin 17.0.16 works. Spring Boot 3.5's free support window has closed; starting there would mean inheriting an EOL line on day one.
- **springdoc-openapi 3.1.0** — the line that supports Boot 4 on Java 17. (`2.x` is Boot 3.x only.)
- ⚠️ Boot 4 ships **Jackson 3** and **Spring Security 7**. Older tutorials will not copy-paste cleanly. Work from official docs.
- Java 21 is *recommended* by Spring (virtual threads) but not required. Optional upgrade, not a blocker.

---

## Current state of the repo (2026-08-06 audit)

**Exists and works:**
- pnpm workspace + Turborepo + Prettier + EditorConfig + `.npmrc`
- `apps/web` — Next **16.3.0**, React 19.2.8, Tailwind v4, Base UI via shadcn "Nova" preset, `lucide-react` ✅, fonts wired (Manrope headings / Outfit body / Geist), `next-intl@4.13.5` pinned in `pnpm-workspace.yaml`
- App Router shells scaffolded: `(landing)/`, `auth/`, `onboarding/`, `workspace/[workspaceId]/`
- `packages/{config,types,utils,validations}`

**Needs work — carried over from Lenzro, not yet Manasik:**
- Every package is named `@lenzro/*`
- `packages/database` is a Prisma schema with `Workspace`/`Page`/`Comment`/`Block` models — **wrong domain, wrong tool** (D1)
- `packages/config/src/env/api.ts` validates env for a **Node** API — obsolete once the API is Java
- `packages/config` ships `eslint/nest.js` + `typescript/nest.json` — obsolete
- `packages/types` + `packages/validations` describe Lenzro's note-taking domain

**Broken / empty / missing:**
- `apps/api` — **completely empty.** Spring Boot scaffolded from zero.
- `.github/workflows/ci.yml` — **empty file**
- `apps/web/package-lock.json` — **npm lock inside a pnpm workspace.** Causes install drift. Delete.
- `apps/web` has no `typecheck` script, but `turbo.json` defines the task
- `.env.example` still describes Neon + Prisma
- **Zero git commits.** Nothing is under version control yet.

--- -->

## Phase 0 — Foundation cleanup (today)

Make the monorepo actually *be* Manasik's before writing a line of feature code.

### 0a. Git safety net
- [ ] `git add -A && git commit` — **first commit.** Yussuf's call; still outstanding.

### 0b. Purge Lenzro
- [x] Deleted `packages/database/` entirely (D1).
- [x] Renamed `@lenzro/*` → `@manasik/*` in all 4 package manifests, the 3 web imports, and both eslint preset headers. `tsconfig.json` had no `@lenzro` paths (resolution is via workspace links).
- [x] `packages/config`: deleted `src/env/api.ts`, `eslint/nest.js`, `typescript/nest.json`, and the whole `tailwind/` folder. Rewrote `constants.ts` (frontend-only), `plans.ts` (agency tiers + module keys, **provisional pricing**), added `src/env/web.ts`. Dropped the now-unused `dotenv` dependency.
- [x] `packages/types`: deleted `block/comment/page/workspace.ts`. Added `agency.ts` (`Role`, `Agency`, `AgencyStatus`). Rewrote `user.ts` (agency-scoped, ISO-string timestamps) and `permission.ts` (6 Manasik roles).
- [x] `packages/validations`: deleted `page.schema.ts` + `workspace.schema.ts`. Rewrote `auth.schema.ts` — register now carries agencyName/ownerName/email/phone/country/timezone/currency/password/acceptTerms, plus `inviteMemberSchema`.
- [x] `packages/utils`: `validation.ts` audited — domain-neutral, kept unchanged.

### 0c. Fix the workspace
- [x] Deleted `apps/web/package-lock.json`.
- [x] Renamed `apps/web` → `@manasik/web`; added `typecheck`. Wired the 4 workspace deps + `zod`.
- [x] Renamed every package's `type-check` script to **`typecheck`** — `turbo.json` defines a `typecheck` task, so the old name meant `pnpm typecheck` silently matched nothing.
- [x] Deleted `apps/web/tailwind.config.ts` and `packages/config/tailwind/` — Tailwind v4 is CSS-first and `globals.css` has no `@config`, so both were dead code globbing a `packages/ui` that doesn't exist.
- [x] Created `apps/api/package.json` (Maven shim) + `apps/api/README.md` explaining why the scripts call `mvn` rather than `./mvnw`.
- [x] Rewrote `.env.example` for the Spring stack, split into api/web sections.
- [x] Wrote `.github/workflows/ci.yml` — `web` job (pnpm → format:check → typecheck → lint → build) + `api` job (guarded; no-ops until `apps/api/pom.xml` exists).
- [ ] **`motion` + `sonner` not installed yet** — deliberately left out rather than guessing version ranges into the manifest. Add during the install step: `pnpm add motion sonner -F @manasik/web`.

**Checkpoint 0:** `pnpm install` completes clean at the root and `pnpm typecheck` passes. *(Not yet run — Rule 1.)*

> **Known issue found during 0c, deferred to Phase 5 (Rule 4):** fonts are loaded **twice** — `next/font/google` in `layout.tsx` *and* `@import url(fonts.googleapis.com/...)` at the top of `globals.css`. The CSS import defeats next/font's self-hosting and preloading and adds a render-blocking request. Separately, `@theme` maps `--font-heading: var(--font-sans)`, which points headings at **Geist**, not Manrope — contradicting the "Manrope for headings, Outfit for body" requirement. Both are a few lines to fix; awaiting design direction.

---

## Phase 1 — Accounts + local infrastructure

No code. Credentials and containers before anything can run.

> **Reordered 2026-08-06:** Docker is **not** needed to start. Phase 2 was rescoped so the Spring skeleton has no database dependency, which means Phases 0 and 2 run on Java + Maven alone. Infrastructure is only truly required at **Phase 3**. Do the Docker/WSL step whenever convenient before then.

- [ ] **Docker Desktop** installed ✅ — but it needs **WSL2**, which isn't installed yet. One command in an *admin* PowerShell, then a reboot:
  ```powershell
  wsl --install
  ```
  Docker Desktop picks it up automatically afterward. **Blocks Phase 3, not Phase 2.**
- [ ] `docker-compose.yml` at repo root — `postgres:17-alpine` (db `manasik`, port 5432) + `redis:7-alpine` (port 6379), both with named volumes.
- [ ] **Resend** — account, verified sending domain, API key. Dev-mode override address so test mail can't reach real people.
- [ ] **JWT secrets** — two independent 64-byte random strings:
  ```powershell
  [Convert]::ToBase64String((1..64 | % { Get-Random -Max 256 }))
  ```
- [ ] `apps/api/.env` (gitignored) — DB URL, Redis URL, both JWT secrets, Resend key, CORS origin.
- [ ] `apps/web/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:4000/v1`.
- [ ] Deferred to their own phases: S3/Supabase Storage, Stripe, Twilio, Sentry, PostHog, Google OAuth.

**Checkpoint 1:** `docker compose up -d` → `psql` connects to `manasik`, `redis-cli ping` returns `PONG`.

---

## Phase 2 — Spring Boot skeleton *(no database — runs without Docker)*

> **Rescoped 2026-08-06.** Originally this phase pulled in Data JPA + Flyway + Redis. That was wrong: with `spring-boot-starter-data-jpa` on the classpath and no reachable database, Spring Boot **fails at startup** on DataSource autoconfiguration — so the checkpoint could never pass without Docker running. Persistence deps now move to Phase 3, where the database actually exists. This phase boots on Java + Maven alone.

- [ ] Scaffold `apps/api` — Spring Boot **4.1.0**, Java **17**, Maven wrapper (`mvnw` committed), group `com.manasik`, artifact `api`, base package `com.manasik.api`.
- [ ] Dependencies **this phase only**: Web, Security, Validation, Lombok, MapStruct, springdoc **3.1.0**, Actuator. Test: JUnit 5, Mockito.
- [ ] Deferred to Phase 3 (they need a live database): Data JPA, PostgreSQL driver, Flyway, Redis, Mail, **Testcontainers**.
- [ ] Package layout — **feature-first, not layer-first**:
  ```
  com.manasik.api
    ├── common/        # exceptions, ApiResponse envelope, audit  [Phase 2]
    ├── config/        # SecurityConfig, OpenApiConfig, CorsConfig [Phase 2]
    │                  # JpaConfig, RedisConfig                    [Phase 3]
    ├── tenancy/       # TenantContext, TenantFilter, resolver      [Phase 3]
    ├── auth/          # controller, service, dto, jwt filters      [Phase 4]
    ├── agency/        # the tenant entity itself                   [Phase 3]
    └── user/          # entity, repository, service                [Phase 3]
  ```
  Only the `[Phase 2]` directories get created now — the rest are shown so the shape is clear from the start.
- [ ] `application.yml` + `application-dev.yml` + `application-prod.yml`. **No secrets in yaml** — env vars only.
- [ ] Global exception handler (`@RestControllerAdvice`) returning a consistent error envelope, with Jakarta Validation field errors preserved for frontend forms.
- [ ] Server port **4000**, context path **`/v1`**.

**Checkpoint 2:** `mvnw spring-boot:run` boots clean, `/v1/actuator/health` returns `UP`, Swagger UI loads.

---

## Phase 3 — Database + multi-tenancy (D2 — the security-critical phase)

**This is the phase where a mistake becomes a cross-agency data leak. Slow down here.**

- [ ] `V1__initial_schema.sql` (Flyway):
  - `agencies` — id (UUID), name, slug, country, city, address, logo_url, license_number, employee_count, pilgrims_per_year, timezone, currency, status, created_at, updated_at
  - `users` — id, **agency_id**, email, password_hash, name, phone, role, is_verified, last_login_at, avatar_url, locale, timestamps. Unique on `(agency_id, email)`.
  - `otp_tokens` — id, user_id, token_hash, purpose (VERIFY_EMAIL / RESET_PASSWORD), expires_at, used_at
  - `refresh_sessions` — optional DB mirror of Redis JTIs for audit
  - `audit_logs` — actor, agency_id, action, entity, entity_id, metadata (jsonb), ip, created_at
  - Enums as Postgres types or check-constrained varchar. Roles: `OWNER`, `ADMIN`, `OPERATIONS`, `FINANCE`, `GUIDE`, `SUPPORT`.
- [ ] `V2__row_level_security.sql` — enable RLS on every tenant-scoped table; policy `agency_id = current_setting('app.current_agency')::uuid`. **The app's DB role must not be the table owner** (owners bypass RLS by default).
- [ ] `tenancy/TenantContext` — `ThreadLocal<UUID>`, cleared in a `finally` block. Non-negotiable: a leaked ThreadLocal on a pooled thread serves one agency's data to another.
- [ ] `CurrentTenantIdentifierResolver` reads `TenantContext`; Hibernate configured `multiTenancy: DISCRIMINATOR`.
- [ ] `@TenantId` on `agency_id` in every tenant-scoped entity.
- [ ] A Hibernate connection-level hook that issues `SET LOCAL app.current_agency = ?` so RLS and Hibernate agree.
- [ ] Tenant id comes **only** from the authenticated JWT claim. **Never** from a request header or body.
- [ ] `BaseEntity` with `@CreatedDate`/`@LastModifiedDate`/`@CreatedBy` via JPA auditing.

**Checkpoint 3:** A Testcontainers integration test proves the leak is impossible — seed two agencies, authenticate as agency A, query users, assert agency B's rows are invisible. Then repeat with a **raw JDBC query** to prove RLS holds independently of Hibernate. **Both must pass.**

---

## Phase 4 — Auth backend

- [ ] `POST /v1/auth/register` — **one transaction** creating `Agency` + `OWNER` user. BCrypt cost 12. User starts unverified, no tokens issued. Generates a 6-digit OTP via `SecureRandom`, stores it **hashed**, emails it via Resend.
- [ ] `POST /v1/auth/verify-email` — validates OTP (checks the *latest* one so "already used" is a distinct error), marks verified, issues the token pair.
- [ ] `POST /v1/auth/login` — **identical error message** for unknown-email and wrong-password (email-enumeration defence). Requires `is_verified`. Updates `last_login_at`.
- [ ] `POST /v1/auth/refresh` — reads HttpOnly cookie. **Reuse detection**: if the JTI is missing from Redis, that token was already rotated — revoke *every* session for that user and log a security warning.
- [ ] `POST /v1/auth/logout` — idempotent, deletes the JTI, clears the cookie.
- [ ] `GET /v1/auth/me` — returns the safe user projection. `password_hash` must never appear in a DTO.
- [ ] `POST /v1/auth/forgot-password` / `reset-password` — same OTP machinery, `RESET_PASSWORD` purpose. Always responds 200 regardless of whether the email exists.
- [ ] **Rate limiting** — Redis-backed, per-IP and per-email, on login / register / forgot-password / verify-email. Not optional.
- [ ] `SecurityConfig` — stateless sessions, JWT filter, CSRF disabled (token auth, not cookie auth for the API surface), CORS locked to the web origin with credentials, security headers on.

### Token rules (do not deviate)
- **Access token** — 15m, signed with the ACCESS secret, returned in the JSON body, held in memory on the frontend (Zustand). Never a cookie, never `localStorage`.
- **Refresh token** — 30d, REFRESH secret, `HttpOnly; Secure; SameSite=Lax`, path-scoped to `/v1/auth`. Fresh `jti` every issue.
- **Redis** — `jti:{userId}:{jti}` → `1`, TTL = refresh expiry. Refresh is valid **only** if its JTI is present. Rotation deletes the old key and writes the new one, every single time.
- **JWT claims** — `sub` (userId), `agencyId`, `role`, `jti`. `agencyId` in the token is what drives `TenantContext`.

**Checkpoint 4:** Full flow green in `apps/api/test/auth.http` — register → verify → me → refresh → me → logout → me (401). Confirm rotation invalidates the old cookie and that the JTI actually disappears from Redis.

---

## Phase 5 — Frontend foundation

Backend is proven before a single auth screen is built.

- [ ] `pnpm gen:api-types` — springdoc spec → `openapi-typescript` → `packages/types` (D4).
- [ ] `next-intl` — EN / AR / FR, `[locale]` routing, **RTL** for Arabic (the layout must actually flip, not just translate).
- [ ] Design tokens finalised in `globals.css` — Manrope headings, Outfit body, Manasik palette. *Awaiting Yussuf's UI direction (Rule 4).*
- [ ] `lib/api.ts` — fetch wrapper: `credentials: 'include'`, injects the in-memory access token, on 401 calls `/v1/auth/refresh` once and retries. **Must de-duplicate concurrent refreshes** or a page with six parallel queries fires six rotations and reuse-detection nukes the session.
- [ ] TanStack Query provider + Zustand auth store (memory only — no token persistence).
- [ ] `sonner` Toaster + `motion` page transitions mounted in the root layout.
- [ ] `middleware.ts` — locale routing + protected-route redirects.

**Checkpoint 5:** A throwaway page calls `/v1/auth/me` and renders the user. Locale switch to Arabic flips the layout to RTL.

---

## Phase 6 — Auth pages

*Design direction required before starting (Rule 4).*

- [ ] `/[locale]/auth/register` — the full field set from `manasik.md`, Zod + shadcn form, agency + owner in one submit.
- [ ] `/[locale]/auth/verify-email` — 6-digit OTP input, resend with cooldown.
- [ ] `/[locale]/auth/login` — email, password, remember me, forgot link.
- [ ] `/[locale]/auth/forgot-password` + `/reset-password`.
- [ ] Shared auth layout, loading states, error surfacing via `sonner`, full RTL check.

**Checkpoint 6:** Register a real agency through the UI, receive the email, verify, log in, land on the dashboard, hard-refresh the tab and stay logged in.

---

## Phase 7 — Onboarding wizard

5 steps per `manasik.md`: Agency Info → Business Details → Choose Modules → Invite Team → Success. Backend endpoints for each step, resumable progress, module flags stored per agency.

---

## Phase 8 — Workspace shell + dashboard

Sidebar, top bar, agency switcher, RBAC-filtered navigation (an OPERATIONS user must not see Finance routes — enforced **server-side**, not just hidden in the UI), dashboard cards and charts.

---

## Later (do not think about these yet)

Pilgrims CRM · Packages · Bookings · Groups · Guides · Hotels · Flights · Transport · Payments + Stripe · Documents + object storage · Tasks · Communication (Resend / Twilio / WhatsApp) · Reports · Global search (Postgres FTS → OpenSearch) · WebSocket notifications · Admin panel · Google/Microsoft OAuth · Passkeys · 2FA · Sentry · PostHog · Deployment (Vercel + Docker on Railway/DO)

Listed only so you can stop worrying about them. When Phase 6 is green, come back and pick the next one.
