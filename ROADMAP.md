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
| **D2** | Tenant isolation | **Shared schema + `organization_id` + Hibernate `@TenantId` + Postgres RLS.** ⚠️ *Revised 2026-08-10 — see D5.* | Hibernate auto-stamps writes and auto-filters reads from a request-scoped tenant context resolved from the **JWT** (never a client header). RLS is the database-level backstop so even hand-written SQL can't leak across organizations. |
| **D3** | Local infrastructure | **Docker Desktop** + `docker-compose` (Postgres 17, Redis 7). | Prod parity locally, and it unlocks **Testcontainers** for real-Postgres integration tests. |
| **D4** | Frontend API types | **Generated from OpenAPI.** springdoc emits the spec from Java DTOs → `openapi-typescript` → `packages/types`. | Backend renames a field and the frontend fails to *compile* instead of failing in production. Zod schemas stay hand-written for form UX. |

### D5 — User ≠ Organization (added 2026-08-10)

**A user does not belong to an organization. A `Membership` joins the two.**

```
User ──< Membership >── Organization
         (role lives here)
```

`users` has **no** `organization_id`. Ahmed can own *Baraka Travels* and simultaneously be a GUIDE at another agency; role is a property of the *relationship*, not the person.

Consequences that ripple outward — none of these are optional once D5 holds:

- **The JWT carries the *active* organization**, not "the user's organization". Claims are `sub`, `organizationId`, `role`, `jti`. Switching workspace re-issues the token. The client never asserts a tenant.
- **`organizationId` is nullable on the token.** A freshly registered user has zero memberships. That's the fork after login: no membership → `/create-workspace`; otherwise open the active one.
- **Registration creates a person, not an agency.** Full name, email, password, accept terms. The workspace is a separate step. (This replaces the earlier single-form "agency + owner in one transaction" design.)
- **Every tenant-scoped table still carries `organization_id`** — D2 is unchanged in mechanism, only renamed. `TenantContext` is populated from the token's `organizationId`.
- **Authorization is permission-based, never role-based.** Code asks `PILGRIM_CREATE`, not `role == 'GUIDE'`. Roles map to permission sets in one table; adding a role must not mean editing branches across the codebase.
- Roles: `OWNER`, `ADMIN`, `OPERATIONS`, `SALES`, `FINANCE`, `GUIDE`, `SUPPORT`. (SALES is new.)

**v1 auth is deliberately minimal:** email + password + email verification. No Google, Microsoft, OTP login, or passkeys — the product's complexity belongs in agency operations, not in signing in.

```
Register → Verify email → Login → has membership?
                                    ├── no  → Create workspace → onboarding → dashboard
                                    └── yes → dashboard
```

### D6 — Supabase specifics (added 2026-08-10, verified against the live project)

**a) Everything lives in a `manasik` schema, never `public`.**
Supabase runs PostgREST over `public` and serves it over HTTPS with the **anon key**, which is public by design and ships in frontend bundles. Our RLS-exempt tables (`users`, `otp_tokens`, `refresh_sessions`, …) would have been world-readable. A schema PostgREST doesn't know about is unreachable, with no dashboard toggle to undo it.

**b) The runtime role must be `manasik_app`, not `postgres`.**
Measured on this project:

```
postgres_bypassrls = true      postgres_superuser = false
```

`BYPASSRLS` overrides even `FORCE ROW LEVEL SECURITY`. While the app connected as `postgres`, the V2 policies filtered **nothing** — D2's database-level backstop was decorative. Hence two identities:

| | Role | Rights |
|---|---|---|
| Flyway | `postgres` | owns tables, DDL, BYPASSRLS (fine here) |
| Runtime | `manasik_app` | no ownership, no DDL, **NOBYPASSRLS** → RLS applies |

`V3__app_role_grants.sql` grants the runtime privileges and **fails loudly** if `manasik_app` is missing, superuser, or holds `BYPASSRLS`. `ALTER DEFAULT PRIVILEGES` covers future tables — without it every new migration silently produces a table the app can't read.

> This is why Checkpoint 3 requires a *raw JDBC* test. Reading the migration would have said "RLS enabled ✅" while it did nothing.

**c) Changing a role's password on Supabase — the trap that cost several rounds.**
This is **rejected**:

```sql
alter role manasik_app with password '...' nosuperuser nobypassrls;
--                                          ^^^^^^^^^^^ 
-- ERROR: permission denied to alter role
-- DETAIL: Only roles with the SUPERUSER attribute may alter roles with the SUPERUSER attribute.
```

Only a superuser may *touch* the SUPERUSER attribute — **including setting it to `NO`** — and Supabase's `postgres` is not one. The error message reads as though the target role is a superuser; it isn't. Set attributes at `CREATE` time, and afterwards change only what you need:

```sql
alter role manasik_app with password '...';   -- works
```

**Confirmed working 2026-08-10:** Supavisor accepts custom roles using the `<role>.<project-ref>` username format (`manasik_app.xigfnnybmgwkvrjobmyq`), so the session pooler works for the non-superuser runtime role. That was the main unknown in this approach.

### Boot 4 module split — the recurring trap (2026-08-10)

Boot 4 broke `spring-boot-autoconfigure` into per-integration modules. Three hits in one session:

| Symptom | Cause |
|---|---|
| `HibernatePropertiesCustomizer` won't import | moved to `org.springframework.boot.hibernate.autoconfigure` (`spring-boot-hibernate`) |
| `server.error.*` deprecated | now `spring.web.error.*` |
| **Flyway silently never ran** — no warning, app booted on an unmigrated DB | `FlywayAutoConfiguration` needs the **`spring-boot-flyway`** module; `flyway-core` alone is not enough |

**Rule of thumb: in Boot 4, if an integration silently does nothing, suspect a missing `spring-boot-<thing>` dependency.**

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

**Checkpoint 2:** ✅ **Confirmed 2026-08-10.** Boots on Spring Boot 4.1.0 / Spring 7.0.8 / Tomcat 11.0.22 / Java 17.0.16, port 4000, context path `/v1`.

| Probe | Result |
|---|---|
| `/v1/actuator/health` | `200` — status `UP` |
| `/v1/actuator/info` | `200` |
| `/v1/api-docs` | `200` — OpenAPI 3.1.0, `bearerAuth` declared |
| `/v1/swagger-ui.html` | `200` |
| `/v1/anything` (no auth) | `403` — deny-by-default works |
| `/v1/actuator/env` | `403` — not exposed |

**Gotchas found during Phase 2 — don't rediscover these:**

1. **Spring Initializr writes a version that doesn't exist.** The generated pom said `<version>4.1.0.RELEASE</version>`; the artifact on Maven Central is plain **`4.1.0`**. Maven then *caches the resolution failure*, so after fixing it you need `mvn -U` or it keeps failing. Also note `search.maven.org`'s index is stale (it tops out at 3.5.3) — trust `repo.maven.apache.org/.../maven-metadata.xml` instead.
2. **Boot 4 renamed starters.** `spring-boot-starter-web` → **`spring-boot-starter-webmvc`**. Initializr also generates per-starter test artifacts (`spring-boot-starter-webmvc-test`, `-security-test`, …) — note `spring-boot-starter-test` still exists at 4.1.0, it just isn't what Initializr picks.
4. **Boot 4 reorganized autoconfigure packages** *(hit 2026-08-10)*: `org.springframework.boot.autoconfigure.<x>` → **`org.springframework.boot.<x>.autoconfigure`**, split across new modules. `HibernatePropertiesCustomizer` moved from `org.springframework.boot.autoconfigure.orm.jpa` to `org.springframework.boot.hibernate.autoconfigure` in the `spring-boot-hibernate` module. **Every Boot 3 autoconfigure import will fail** — when one doesn't resolve, find its real home with `unzip -l` over the 4.1.0 jars rather than guessing.
3. **MapStruct's "release" version is `1.7.0.Beta2`** — a beta. Pinned to **1.6.3**, the newest stable.

**Two things deliberately left for Phase 4:**

- ⚠️ **Unauthenticated requests return `403`, not `401`.** Spring Security's `AuthorizationFilter` denies the anonymous user before any authentication entry point runs, so `GlobalExceptionHandler`'s `AuthenticationException` branch is never reached. Fix is a custom `AuthenticationEntryPoint` returning 401 JSON — it belongs with the JWT filter, not before it.
- ⚠️ **`UserDetailsServiceAutoConfiguration` is generating a random dev password** on every boot. Harmless today (form login and HTTP Basic are both disabled, so nothing can consume it), and it disappears the moment we register a real `UserDetailsService`.

---

## Phase 3 — Database + multi-tenancy (D2 — the security-critical phase)

**This is the phase where a mistake becomes a cross-agency data leak. Slow down here.**

- [ ] `V1__initial_schema.sql` (Flyway) — **identity tables are NOT tenant-scoped** (D5):
  - `users` — id (UUID), full_name, email **globally unique**, password_hash, email_verified, avatar_url, locale, last_login_at, timestamps. **No `organization_id`.**
  - `organizations` — id, name, slug, logo_url, country, currency, timezone, organization_type, pilgrims_per_year, status, timestamps
  - `memberships` — id, user_id, organization_id, role, status (`INVITED`/`ACTIVE`/`SUSPENDED`), invited_at, joined_at, timestamps. **Unique on `(user_id, organization_id)`.**
  - `invitations` — id, organization_id, email, role, token_hash, expires_at, accepted_at. Covers inviting someone who has no account yet.
  - `subscriptions` — id, organization_id, plan, status, trial_ends_at, current_period_ends_at
  - `otp_tokens` — id, user_id, token_hash, purpose (`VERIFY_EMAIL`/`RESET_PASSWORD`), expires_at, used_at
  - `audit_logs` — actor_user_id, organization_id, action, entity, entity_id, metadata (jsonb), ip, created_at
  - Roles: `OWNER`, `ADMIN`, `OPERATIONS`, `SALES`, `FINANCE`, `GUIDE`, `SUPPORT`.
- [ ] `V2__row_level_security.sql` — RLS on every **tenant-scoped** table; policy `organization_id = current_setting('app.current_organization')::uuid`.
  - ⚠️ `users` is **exempt** — it's global, and a user with no membership must still be able to log in. Isolation for people comes from `memberships`, not from a column on `users`.
  - **The app's DB role must not own the tables** — owners bypass RLS unless `FORCE ROW LEVEL SECURITY` is set.
- [ ] `tenancy/TenantContext` — `ThreadLocal<UUID>`, cleared in a `finally` block. Non-negotiable: a leaked ThreadLocal on a pooled thread serves one agency's data to another.
- [ ] `CurrentTenantIdentifierResolver` reads `TenantContext`; Hibernate configured `multiTenancy: DISCRIMINATOR`.
- [ ] `@TenantId` on `organization_id` in every tenant-scoped entity (not on `User`, `Membership`, or `Invitation` — those are queried *across* tenants by design).
- [ ] Hibernate connection hook issuing `SET LOCAL app.current_organization = ?` so RLS and Hibernate agree.
- [ ] Tenant id comes **only** from the JWT's `organizationId` claim, and **only** after verifying the user has an `ACTIVE` membership for it. **Never** from a header or body.
- [ ] `BaseEntity` with `@CreatedDate`/`@LastModifiedDate`/`@CreatedBy` via JPA auditing.

**Checkpoint 3:** ✅ **Confirmed 2026-08-14.** `mvn verify` → `TenantIsolationIT`, **5/5 passing** against a real PostgreSQL 17 container.

| Test | Proves |
|---|---|
| `hibernateFiltersToActiveTenant` | `@TenantId` scopes `findAll()` to org A without any explicit filter |
| `noTenantSeesNothing` | a tenant-less context returns **zero** rows, not all rows — fails closed |
| `rowLevelSecurityHoldsForRawSql` | **native SQL** through the app pool still only sees org A — RLS works independently of Hibernate |
| `applicationRoleCannotBypassRls` | the runtime role holds neither `BYPASSRLS` nor `SUPERUSER` — guards the guard |
| `dualMemberSeesOnlyActiveOrganization` | a member of **both** A and B, active in A, sees only A; switching to B flips it |

**Why the container mirrors production exactly:** `testcontainer-init.sql` creates `manasik_app` with `NOBYPASSRLS` before Spring starts, and Flyway runs as the container superuser. Testing as the default superuser would have bypassed RLS entirely and every assertion would have passed for the wrong reason.

**Two test-infrastructure traps hit:**
1. **Surefire silently skips `*IT` classes** — that's Failsafe's convention. The build was green while the isolation tests never ran. Added `maven-failsafe-plugin` bound to `integration-test` + `verify`.
2. **`@BeforeAll` runs before the Spring context**, so before Flyway migrates — seeding there fails with `relation does not exist`. Seed from `@BeforeEach` behind a `seeded` flag instead.
3. Boot 4's BOM does **not** manage Testcontainers versions; import `testcontainers-bom` explicitly.

---

## Phase 4 — Auth backend

- [ ] `POST /v1/auth/register` — creates a **person only** (D5): full name, email, password, accept terms. **No organization.** BCrypt cost 12, user starts unverified, no tokens issued. 6-digit OTP via `SecureRandom`, stored **hashed**, emailed via Resend.
- [ ] `POST /v1/auth/verify-email` — validates OTP (checks the *latest* one so "already used" is a distinct error), marks verified, issues the token pair with `organizationId: null`.
- [ ] `POST /v1/auth/login` — **identical error message** for unknown-email and wrong-password (email-enumeration defence). Requires verified email. Updates `last_login_at`. Returns `memberships[]` + `activeOrganizationId` so the frontend knows whether to route to `/create-workspace` or the dashboard.
- [ ] `POST /v1/organizations` — creates the workspace **and** an `OWNER` membership in one transaction, plus a TRIAL subscription. Re-issues the token with the new `organizationId`.
- [ ] `POST /v1/auth/switch-organization` — verifies an `ACTIVE` membership for the target, then re-issues the token pair with the new `organizationId`/`role`. **This is the only way the active tenant changes.**
- [ ] `POST /v1/organizations/{id}/invitations` + `POST /v1/invitations/accept` — invite by email with a role; accepting creates the `Membership`. Handles both "has an account" and "needs to set a password" paths.
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
- **JWT claims** — `sub` (userId), `organizationId` (**nullable** — a new user has none), `role`, `jti`. `organizationId` drives `TenantContext`.
- **Re-issue on switch** — changing workspace mints a new token pair. Never mutate the tenant server-side while leaving an old token valid, and never let the client pick a tenant per-request.

**Checkpoint 4:** Full flow green in `apps/api/test/auth.http` — register → verify → login (0 memberships) → create workspace → me (1 membership) → refresh → switch → logout → me (401). Confirm rotation invalidates the old cookie and that the JTI actually disappears from Redis.

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
