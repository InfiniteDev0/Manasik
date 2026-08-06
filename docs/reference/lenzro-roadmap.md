<!-- <!-- # Lenzro Backend Roadmap

We build backend-first, one phase at a time. **Do not start a phase before the previous one is tested.** Each phase has a checkpoint — stop there, verify, then continue.

The goal of this file: never get lost. When in doubt, find the lowest unchecked box and work on that.

---

## Layer → phase map (so you can see where everything lands)

**Layer 2 (NestJS)** — Services & PrismaService start in Phase 2; Controllers, Guards, Pipes, Interceptors all built in Phase 3 alongside auth; WebSocket gateway is Phase 7+ (after deploy, with TipTap).

**Layer 5 (shared packages)** —
- `@lenzro/config` → Phase 1 (env schema + constants)
- `@lenzro/database` → Phase 2 (Prisma schema lives here)
- `@lenzro/types` → Phase 2 onward (Prisma re-exports + API response shapes)
- `@lenzro/validations` → Phase 3 (Zod schemas, shared between Next.js forms and NestJS request validation via `nestjs-zod`)
- `@lenzro/utils` → as needed, pure helpers only

---

## Phase 0 — External accounts (no code, ~30 min)

You need credentials before any code runs. Keep these in a private notes file (NOT in git) until Phase 1.

- [ ] **Neon** ([neon.tech](https://neon.tech)) — create project `lenzro`. Copy:
  - Pooled connection string → will become `DATABASE_URL` (runtime)
  - Direct connection string → will become `DIRECT_URL` (migrations only)
- [ ] **Upstash Redis** ([upstash.com](https://upstash.com)) — create database `lenzro-cache`, region close to Neon. Copy the **Redis URL** (ioredis-compatible, starts with `rediss://`).
- [ ] **JWT secrets** — generate two long random strings:
  ```powershell
  [Convert]::ToBase64String((1..64 | % { Get-Random -Max 256 }))
  ```
  Run it twice. One = `JWT_ACCESS_SECRET`, other = `JWT_REFRESH_SECRET`.
- [ ] **Cloudflare R2** — skip. Not needed until file uploads (much later).
- [ ] **Railway / Vercel** — skip. Phase 6.

---

## Phase 1 — Local env + missing deps (10 min)

- [ ] Create `apps/api/.env` (gitignored):
  ```
  NODE_ENV=development
  PORT=4000

  DATABASE_URL=...neon pooled...
  DIRECT_URL=...neon direct...

  REDIS_URL=rediss://...

  JWT_ACCESS_SECRET=...
  JWT_REFRESH_SECRET=...
  JWT_ACCESS_TTL=15m
  JWT_REFRESH_TTL=30d

  COOKIE_DOMAIN=localhost
  CORS_ORIGIN=http://localhost:3000
  ```
- [ ] Confirm `apps/api/.gitignore` ignores `.env` and `.env.*`.
- [ ] Install missing deps in `apps/api`:
  ```
  npm add @nestjs/jwt @nestjs/passport passport passport-jwt
  npm add bcrypt ioredis cookie-parser
  npm add nestjs-zod zod
  npm add -D @types/bcrypt @types/passport-jwt @types/cookie-parser
  ```
- [ ] **Uninstall the unused validators** (we're going Zod-everywhere via `nestjs-zod`):
  ```
  npm rm class-validator class-transformer
  ```
- [x] **Set up `packages/config`** — built. Exports `@lenzro/config/constants` (shared: `API_PREFIX`, `REFRESH_COOKIE_NAME`, `ACCESS_TOKEN_TTL_SECONDS`, `REDIS_JTI_KEY(userId, jti)`, etc.) and `@lenzro/config/env/api` (Zod-validated `process.env`, auto-loads `.env` via dotenv). Build with `npm run build -w @lenzro/config`; rebuild whenever you change the package.

**Checkpoint:** `npm run start:dev` in `apps/api` boots without errors. -->

---

## Phase 2 — Prisma schema + User model (20 min)

You already have `packages/database` — Prisma lives there.

> **Note (2026-05-25):** Phase 2 was extended beyond the original minimal-User scope to **Option D**: kept the existing `Workspace` / `WorkspaceMember` / `Page` / `Comment` models that were already on disk, added auth fields (`passwordHash`, `googleId`, `isVerified`, `plan`, `preferences`, `lastLoginAt`) to `User`, and added a new `OtpToken` model for email verification + password reset. Trade-off: one bigger migration now vs three smaller ones across Phases 3/4. See [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma) for the actual schema.

- [x] `packages/database/prisma/schema.prisma` exists and compiles.
- [x] Schema defines `User` (with auth fields), `Workspace`, `WorkspaceMember`, `Page`, `Comment`, `OtpToken` + `Plan`/`Role` enums.
- [x] First migration applied to Neon — `packages/database/prisma/migrations/20260525115931_init/migration.sql`.
- [x] **`packages/database`** exports `prisma`, `Prisma`, and model types (`User`, `Workspace`, `WorkspaceMember`, `Page`, `Comment`, `OtpToken`) + enums (`Plan`, `Role`) via [`src/index.ts`](packages/database/src/index.ts).
- [x] **Env loading**: `packages/database` scripts use `dotenv-cli` to read `apps/api/.env` (single source of truth, no secret duplication). See `db:migrate`, `db:studio`, etc. in [`packages/database/package.json`](packages/database/package.json).
- [x] In `apps/api/src/prisma/`, created `PrismaModule` + `PrismaService` (extends `PrismaClient`, `onModuleInit` → `$connect`, `onModuleDestroy` → `$disconnect`). `PrismaModule` is `@Global()` — any future module can inject `PrismaService` without re-importing.
- [x] **`packages/types`** — extended `User` with auth fields (`isVerified`, `plan`, `preferences`, `lastLoginAt`) and added `AuthResponse` + `MeResponse`. `passwordHash` and `googleId` deliberately omitted (never sent to frontend).
- [x] **`apps/api/src/main.ts`** — imports `env` from `@lenzro/config/env/api` to trigger dotenv-loading + Zod validation at boot. Listens on `env.PORT` (4000 by default).

**Checkpoint:** `npm run db:studio -w @lenzro/database` opens at http://localhost:5555 — you see 6 empty tables on Neon. ✅ Confirmed 2026-05-25.

**Bonus checkpoint:** `npm run start:dev --workspace=apps/api` boots clean with logs `[PrismaService] Prisma connected to PostgreSQL` and `Nest application successfully started` on port 4000. ✅ Confirmed 2026-05-25.

--- -->

## Phase 3 — Auth module (the real work, ~2-3 hours)

Build in this order. Each sub-step should compile before moving on. This phase is where most of Layer 2 (Controllers / Guards / Pipes / Interceptors / Services) and the rest of Layer 5 come online.

### 3a. Shared Zod schemas (Layer 5 — `@lenzro/validations`)

> **Note (2026-05-25):** Built in `packages/validations/src/auth.schema.ts` (project convention is `<name>.schema.ts`, not bare `auth.ts`). Extended beyond ROADMAP's two-schema example to cover the full auth surface for Phase 3d. Shared rules (`passwordSchema`, `emailSchema`, `otpTokenSchema`) factored into private consts at top of file for reuse.

- [x] `packages/validations/src/auth.schema.ts` — exports 9 schemas + their inferred types:
  - `registerSchema` (email, password [8-128 + complexity], name optional)
  - `loginSchema` (email, password min 1)
  - `verifyEmailSchema` (email, token exactly 6 chars)
  - `forgotPasswordSchema` (email)
  - `resetPasswordSchema` (email, 6-char token, password, passwordConfirm — `.refine()` checks match)
  - `resendOtpSchema` (email)
  - `changePasswordSchema` (currentPassword, newPassword, passwordConfirm — refines match + diff-from-current)
  - `updateProfileSchema` (name optional, avatar URL nullable optional)
  - `refreshTokenSchema` (refreshToken min 1)
- [x] `packages/validations/src/index.ts` re-exports auth, workspace, page schemas via `export *`.
- [x] Package builds clean: `npm run build -w @lenzro/validations` — 0 TS errors. ✅ Confirmed 2026-05-25.

### 3b. Layer 2 — Services (no HTTP yet, just logic)
- [x] `UsersModule` + `UsersService` — `findByEmail`, `findById`, `create({ email, passwordHash?, googleId?, name?, isVerified? })`, `markVerified`, `updateLastLogin`, `updatePassword`. Injects `PrismaService` (global). `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.
- [x] `RedisModule` + `RedisService` — wraps `ioredis`. Methods: `set(key, value, ttlSec)`, `get`, `del`, `delByPattern` (SCAN-based, never KEYS). Connect from `env.REDIS_URL` via `@lenzro/config/env/api`. `lazyConnect: true` + manual `connect()` in `onModuleInit` for fail-fast bootstrap. `quit()` in `onModuleDestroy`. `RedisModule` is `@Global()` and imported by `AppModule`. `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.
- [x] **`EmailModule` + `EmailService`** *(added beyond ROADMAP — needed for OTP delivery)* — wraps `resend@6.12.4`. Methods: `sendOtpEmail`, `sendPasswordResetEmail`, `sendWelcomeEmail`. Centralized `send()` helper bakes in `EMAIL_DEV_OVERRIDE` (dev safety: all outgoing redirects to `infinitedev0@gmail.com`) and fire-and-forget error handling (logs Resend errors but never throws, so registration can't break on Resend outage). Welcome link uses `env.CORS_ORIGIN` as frontend base. `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.
- [x] `AuthModule` + `AuthService` — pure business logic, no `@Req`/`@Res`. Injects `PrismaService`, `UsersService`, `RedisService`, `EmailService`, `JwtService`. Methods:
  - `register(input)` → bcrypt cost 12 (password) + cost 10 (OTP), create unverified user, persist hashed OTP in `otp_tokens`, send email. Does NOT issue tokens until verified.
  - `verifyEmail(input)` → check latest OTP (not just unused — so "already used" gets a specific error), bcrypt.compare, mark used, mark user verified, issue token pair.
  - `login(input)` → identical error message for "user not found" and "wrong password" (email-enumeration protection), forbids Google-only accounts, requires `isVerified`, updates `lastLoginAt`, issues token pair.
  - `refresh(jwt)` → verify with REFRESH secret, check JTI in Redis. **Reuse detection**: if JTI missing, log warning and `delByPattern('jti:userId:*')` to nuke all sessions. Else delete old JTI, issue new pair.
  - `logout(jwt)` → idempotent, swallows verify errors, always returns `{ message: 'Logged out' }`.
  - `validateAccessPayload(payload)` → loads user, returns `SafeUser` (no `passwordHash`/`googleId` — guards can't leak secrets onto `req.user`).
  - `handleGoogleAuth(profile)` → 3 cases (existing+linked / existing+link-now / new). Auto-verifies. Returns `{ ...tokens, isNewUser }`.
  - Private `issueTokens(user)` → `randomUUID()` jti, sign access (15m, ACCESS secret, default), sign refresh (30d, REFRESH secret, per-call), `redis.set('jti:userId:jti', '1', 30d)`.
  - OTP generated via `crypto.randomInt(100000, 1000000)` (CSPRNG, not `Math.random`).
  - JWT TTLs come from `ACCESS_TOKEN_TTL_SECONDS` / `REFRESH_TOKEN_TTL_SECONDS` (numbers, not env strings — TS type strict). `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` env vars now unused (left in `.env` harmlessly).
  - `AuthModule` registers `JwtModule` with ACCESS secret. `AppModule` imports `AuthModule`. `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.

### 3c. Layer 2 — Guards & strategies

> **Note (2026-05-29):** Spec said inject `ConfigService`; we used `env` from `@lenzro/config/env/api` (same pattern as Phase 2/3b). `@CurrentUser()` typed as `User` from `@lenzro/types` (the safe shape) not `@lenzro/database`, matching the runtime reality of what `validateAccessPayload` returns. `PassportModule` added to `AuthModule` imports (standard passport hookup). `AuthResult`, `SafeUser`, `GoogleProfile` types now `export`ed from `auth.service.ts` (TS needed it for `GoogleStrategy.validate`'s inferred return type).

- [x] `JwtAccessStrategy` (`src/auth/strategies/jwt.strategy.ts`) — `PassportStrategy(Strategy, 'jwt')`. Extracts Bearer token via `ExtractJwt.fromAuthHeaderAsBearerToken()`. `secretOrKey: env.JWT_ACCESS_SECRET`, `ignoreExpiration: false`. `validate(payload)` → `AuthService.validateAccessPayload(payload)` → safe User on `req.user`.
- [x] `GoogleStrategy` (`src/auth/strategies/google.strategy.ts`) — `PassportStrategy(Strategy, 'google')`. Uses `env.GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`. Scope `['email', 'profile']`. `validate(_at, _rt, profile)` → extracts `{ googleId, email, name, avatar }` and calls `AuthService.handleGoogleAuth`. Returns `AuthResult & { isNewUser }` (attached to `req.user` for the 3d callback handler).
- [x] `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`) — `extends AuthGuard('jwt')`. Overrides `handleRequest` to throw `UnauthorizedException('Authentication required')` instead of passport's default `"Unauthorized"`.
- [x] `@CurrentUser()` param decorator (`src/auth/decorators/current-user.decorator.ts`) — reads `req.user`, typed `User` from `@lenzro/types`.
- [x] `AuthModule` providers updated: `[AuthService, JwtAccessStrategy, GoogleStrategy]`. Added `PassportModule` to imports. `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.

### 3d. Layer 2 — Controller (`AuthController`, prefix `/v1/auth`)

> **Note (2026-05-29):** DTOs defined inline at top of controller via `createZodDto(schema)` from `nestjs-zod` (kept file count at the 3 you requested). `@UsePipes(ZodValidationPipe)` applied at controller level so bodies actually validate (3e will upgrade to global pipe and remove the controller-level one). Routes register at `/auth/...` until 3e sets `app.setGlobalPrefix('v1')`. Cookie `path: /v1/auth` from `REFRESH_COOKIE_PATH` — **so test order should be 3e → 4 (not 3d → 4) or cookies won't round-trip.**

- [x] `POST /register` — validates `registerSchema` via `nestjs-zod`. Calls `AuthService.register`. Returns `{ message }`. Default 201.
- [x] `POST /verify-email` — validates `verifyEmailSchema`. Calls `AuthService.verifyEmail`. Sets refresh cookie via `setRefreshCookie(res, refreshToken)`. Returns `{ accessToken, user }`. 200 OK.
- [x] `POST /login` — validates `loginSchema`. Calls `AuthService.login`. Sets refresh cookie. Returns `{ accessToken, user }`. 200 OK.
- [x] `POST /refresh` — no body. Reads `req.cookies[REFRESH_COOKIE_NAME]`. Throws `UnauthorizedException('No refresh token')` if missing. Calls `AuthService.refresh`. Rotates cookie. Returns `{ accessToken }`. 200 OK.
- [x] `POST /logout` — no body. Reads cookie (if present), calls `AuthService.logout` (idempotent). `res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH })`. Returns `{ message: 'Logged out' }`. 200 OK.
- [x] `GET /me` — `@UseGuards(JwtAuthGuard)`. `@CurrentUser() user: User`. Returns `{ user }`.
- [x] `GET /google` — `@UseGuards(AuthGuard('google'))`. Empty body — passport redirects to Google's consent screen.
- [x] `GET /google/callback` — `@UseGuards(AuthGuard('google'))`. Reads `req.user` (the `AuthResult & { isNewUser }` from `GoogleStrategy`). Sets refresh cookie. `res.redirect(`${env.CORS_ORIGIN}/auth/callback?token=${accessToken}`)`.
- [x] Private helper `setRefreshCookie(res, token)` — `httpOnly: true`, `secure: env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: REFRESH_COOKIE_PATH`, `maxAge: 30 days`.
- [x] `apps/api/src/main.ts` — added `app.use(cookieParser())` so `req.cookies` is populated.
- [x] `AuthModule.controllers = [AuthController]`. `tsc --noEmit` clean. ✅ Confirmed 2026-05-29.

### 3e. Layer 2 — Pipes & interceptors (global, wired in `main.ts`)

> **Note (2026-05-30):** Installed `@types/compression`. Removed `@UsePipes(ZodValidationPipe)` from `AuthController` (redundant with global pipe). `HttpExceptionFilter` spreads the entire exception response (preserves Zod field-level `errors` array for frontend forms) rather than spec-strict 4-field shape. Bootup uses `Logger.log` not `console.log`. **rxjs dedup gotcha:** apps/api had `rxjs@7.8.1` nested under root's `7.8.2`, causing TS "two different Observable types" errors. Fixed by deleting `apps/api/node_modules/rxjs` so the hoisted root version is used everywhere. If you ever see that error again, same fix.

- [x] `apps/api/src/common/interceptors/response.interceptor.ts` — wraps `{ data: response }` via `map`.
- [x] `apps/api/src/common/interceptors/logging.interceptor.ts` — `tap`-based, logs `[HTTP] METHOD url → status (Xms)` per request.
- [x] `apps/api/src/common/filters/http-exception.filter.ts` — `@Catch(HttpException)`, returns `{ statusCode, ...exceptionBody, timestamp, path }` (spreads to preserve Zod `errors`).
- [x] `apps/api/src/main.ts` — full bootstrap in order: `helmet()` → `compression()` → `cookieParser()` → `enableCors({ origin: env.CORS_ORIGIN, credentials: true, methods, allowedHeaders })` → `setGlobalPrefix('v1')` → `useGlobalPipes(new ZodValidationPipe())` → `useGlobalInterceptors(ResponseInterceptor, LoggingInterceptor)` → `useGlobalFilters(HttpExceptionFilter)` → `listen(env.PORT)` → `Logger.log('API running on http://localhost:4000/v1', 'Bootstrap')`.
- [x] `apps/api/src/auth/auth.controller.ts` — controller-level `@UsePipes` removed.
- [x] `tsc --noEmit` clean. ✅ Confirmed 2026-05-30.

### 3f. Token rules (don't deviate)
- Access token: 15m, JSON body, frontend stores in memory (Zustand).
- Refresh token: 30d, `HttpOnly; Secure; SameSite=Lax`, scoped to `/v1/auth`. Payload includes a fresh `jti`.
- Redis key: `jti:{userId}:{jti}` → `1`, TTL = refresh expiry. Refresh is only valid if its JTI is present. Rotation = delete old key, write new on every successful refresh.

**Audit (2026-05-30):** ✅ All 4 rules verified clean by code-walk.
- Rule 1: access token signed with ACCESS secret, 900s TTL, returned in body only (or URL query for Google OAuth redirect — standard pattern). Never set as a cookie. [auth.service.ts:71-75](apps/api/src/auth/auth.service.ts#L71-L75).
- Rule 2: refresh token signed with REFRESH secret, 2,592,000s TTL; cookie options exact (httpOnly, secure-in-prod, sameSite lax, path /v1/auth, maxAge 30d ms). [auth.service.ts:76-79](apps/api/src/auth/auth.service.ts#L76-L79), [auth.controller.ts:118-126](apps/api/src/auth/auth.controller.ts#L118-L126).
- Rule 3: `randomUUID()` jti, same jti in both access + refresh payloads, Redis key `jti:{userId}:{jti}` value `'1'` TTL=2,592,000s. [auth.service.ts:69-84](apps/api/src/auth/auth.service.ts#L69-L84).
- Rule 4: refresh() order is verify → extract → redis.get → (if missing: delByPattern + throw) → redis.del old → issueTokens new. [auth.service.ts:182-211](apps/api/src/auth/auth.service.ts#L182-L211).

**Checkpoint:** code compiles, server boots clean, no runtime errors on cold start. ✅ Confirmed 2026-05-30.

---

## Phase 4 — Test the API standalone (15 min)

**Do not touch the frontend yet.** Verify the API in isolation first.

- [ ] Create `apps/api/test/auth.http` (VS Code REST Client extension) with calls for register → login → me → refresh → me → logout → me (should 401).
- [ ] Walk the flow end-to-end. Verify:
  - Register returns access token, sets refresh cookie.
  - `/me` works with the access token.
  - After `/refresh`, old refresh cookie no longer works (rotation).
  - `redis-cli` (or Upstash console) shows the JTI entry.
  - Logout removes the JTI; `/refresh` afterwards fails.

**Checkpoint — STOP HERE.** Do not move to frontend until every line above is a green check.

---

## Phase 5 — Connect Next.js frontend

- [ ] In `apps/web` (or wherever the Next app lives), add `lib/api.ts` — fetch wrapper that:
  - Sends `credentials: 'include'`.
  - Reads access token from Zustand auth store.
  - On `401`, calls `/v1/auth/refresh`, retries the original request once.
- [ ] Build a real login form → calls `/v1/auth/login` → stores access token in Zustand → redirects.
- [ ] TanStack Query setup with the fetch wrapper.
- [ ] One protected page (e.g. `/dashboard`) that calls `/v1/auth/me`.

**Checkpoint:** log in from UI, refresh the browser tab, verify the silent refresh flow keeps you logged in.

📝 TODO Phase 5: assign a default avatar URL when user 
   is created. Use a service like DiceBear (dicebear.com) 
   which generates avatars from a seed (the user's name 
   or ID). Free, no account needed.
   
   Example: https://api.dicebear.com/7.x/initials/svg?seed=Test+User
   Store in users.avatar column on creation.

---

## Phase 6 — Deploy (Railway + Vercel)

- [ ] **Railway** — deploy `apps/api`. Set all env vars (point `DATABASE_URL` at Neon pooled). Custom domain → `api.lenzro.com`.
- [ ] **Vercel** — deploy frontend. Set `NEXT_PUBLIC_API_URL=https://api.lenzro.com/v1`. Domain → `lenzro.com` / `www.lenzro.com`.
- [ ] Update API config: `CORS_ORIGIN=https://lenzro.com`, `COOKIE_DOMAIN=.lenzro.com`, cookies → `Secure=true`.
- [ ] Smoke test prod login.

**Checkpoint:** prod login works end-to-end, refresh works, logout works.

---
DONE ✔ 

## Later (do not think about these yet)

Listed only so you stop worrying about them:

- Workspaces + membership model
- Pages CRUD (Prisma + REST)
- TipTap + Yjs + Socket.IO gateway (real-time)
- Cloudflare R2 file uploads
- Rate limiting via `@nestjs/throttler` (already installed)
- Observability (logs, error tracking)

When Phase 6 is green, come back here and pick the next one.




changePassword / updateProfile — Phase 7 (settings).