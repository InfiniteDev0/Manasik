# Authentication Flow

Lenzro uses **JWT-based stateless authentication** with short-lived access tokens and long-lived refresh tokens. All auth logic lives in `apps/api/src/auth/`.

---

## Table of Contents

- [Token Architecture](#token-architecture)
- [Registration Flow](#registration-flow)
- [Login Flow](#login-flow)
- [Token Refresh Flow](#token-refresh-flow)
- [Logout Flow](#logout-flow)
- [Password Reset Flow](#password-reset-flow)
- [Role-Based Access Control](#role-based-access-control)
- [Guards and Decorators](#guards-and-decorators)
- [Security Considerations](#security-considerations)

---

## Token Architecture

```
┌──────────────────────────────────────────────┐
│                 JWT Tokens                   │
│                                              │
│  Access Token                                │
│  ─────────────────────────────────────────  │
│  • Expires: 15 minutes                       │
│  • Payload: { sub, email, workspaceIds[] }   │
│  • Signed with: ACCESS_TOKEN_SECRET          │
│  • Stored: memory (never persisted)          │
│                                              │
│  Refresh Token                               │
│  ─────────────────────────────────────────  │
│  • Expires: 30 days                          │
│  • Payload: { sub, jti (unique token ID) }   │
│  • Signed with: REFRESH_TOKEN_SECRET         │
│  • Stored: HttpOnly cookie + Redis hash      │
└──────────────────────────────────────────────┘
```

Access tokens are sent in the `Authorization: Bearer <token>` header. Refresh tokens travel exclusively as **HttpOnly, Secure, SameSite=Strict cookies** — never exposed to JavaScript.

---

## Registration Flow

```
Client                          API                          Database
  │                              │                               │
  │  POST /auth/register         │                               │
  │  { name, email, password }   │                               │
  │─────────────────────────────►│                               │
  │                              │  Validate (Zod)               │
  │                              │  Check email uniqueness ─────►│
  │                              │◄──────────────────────────────│
  │                              │  Hash password (bcrypt, 12)   │
  │                              │  Create user ────────────────►│
  │                              │◄──────────────────────────────│
  │                              │  Sign access + refresh tokens │
  │                              │  Store refresh token in Redis │
  │◄─────────────────────────────│                               │
  │  200 { user, accessToken }   │                               │
  │  Set-Cookie: refreshToken    │                               │
```

**Validation rules** (from `@lenzro/validations` `registerSchema`):
- Email: valid format, normalized to lowercase
- Password: 8–128 chars, must include uppercase, lowercase, digit, and special character
- Name: 1–100 chars, trimmed

---

## Login Flow

```
Client                          API                          Database / Redis
  │                              │                                │
  │  POST /auth/login            │                                │
  │  { email, password }         │                                │
  │─────────────────────────────►│                                │
  │                              │  Find user by email ──────────►│
  │                              │◄──────────────────────────────│
  │                              │  bcrypt.compare(password, hash)│
  │                              │  [fail → 401 generic message] │
  │                              │  Sign access + refresh tokens  │
  │                              │  Store refresh token in Redis ►│
  │◄─────────────────────────────│                                │
  │  200 { user, accessToken }   │                                │
  │  Set-Cookie: refreshToken    │                                │
```

> **Rate limiting:** Login is rate-limited to **10 attempts per 15 minutes** per IP. After 5 failed attempts for the same email, the account is temporarily locked for 10 minutes.

---

## Token Refresh Flow

```
Client                          API                       Redis
  │                              │                          │
  │  POST /auth/refresh           │                          │
  │  Cookie: refreshToken        │                          │
  │─────────────────────────────►│                          │
  │                              │  Verify refresh token    │
  │                              │  Check jti in Redis ────►│
  │                              │◄─────────────────────────│
  │                              │  Rotate: delete old jti  │
  │                              │  Issue new access token  │
  │                              │  Issue new refresh token │
  │                              │  Store new jti in Redis ►│
  │◄─────────────────────────────│                          │
  │  200 { accessToken }         │                          │
  │  Set-Cookie: refreshToken    │                          │
```

Token rotation: every refresh invalidates the old refresh token and issues a new one. **Refresh token reuse detection** — if an already-used `jti` is presented, all tokens for that user are immediately revoked.

---

## Logout Flow

```
Client                          API                       Redis
  │                              │                          │
  │  POST /auth/logout           │                          │
  │  Cookie: refreshToken        │                          │
  │─────────────────────────────►│                          │
  │                              │  Verify refresh token    │
  │                              │  Delete jti from Redis ─►│
  │                              │  Clear cookie            │
  │◄─────────────────────────────│                          │
  │  200 { message: "OK" }       │                          │
  │  Set-Cookie: refreshToken="" │                          │
```

---

## Password Reset Flow

```
Client            API              Database          Email Service
  │                │                  │                   │
  │  POST /auth/forgot-password       │                   │
  │  { email }     │                  │                   │
  │───────────────►│                  │                   │
  │                │  Find user ─────►│                   │
  │                │  Generate 6-digit OTP (10 min TTL)   │
  │                │  Store OTP hash in Redis             │
  │                │  Send reset email ───────────────────►│
  │◄───────────────│                  │                   │
  │  200 (always)  │                  │                   │
  │  [no enum of   │                  │                   │
  │   valid emails]│                  │                   │
  │                │                  │                   │
  │  POST /auth/reset-password        │                   │
  │  { token, password, passwordConfirm }                 │
  │───────────────►│                  │                   │
  │                │  Verify OTP      │                   │
  │                │  Hash new password                   │
  │                │  Update user ───►│                   │
  │                │  Invalidate all refresh tokens       │
  │◄───────────────│                  │                   │
  │  200 OK        │                  │                   │
```

---

## Role-Based Access Control

Every API request that touches workspace resources is checked against the caller's membership role.

### Permission Matrix

| Action                     | OWNER | ADMIN | MEMBER | GUEST |
|---------------------------|:-----:|:-----:|:------:|:-----:|
| Delete workspace           |  ✅   |  ❌   |   ❌   |  ❌   |
| Manage members             |  ✅   |  ✅   |   ❌   |  ❌   |
| Invite members             |  ✅   |  ✅   |   ❌   |  ❌   |
| Create / edit pages        |  ✅   |  ✅   |   ✅   |  ❌   |
| Archive / delete pages     |  ✅   |  ✅   |   ✅   |  ❌   |
| View pages                 |  ✅   |  ✅   |   ✅   |  ✅   |
| Comment on pages           |  ✅   |  ✅   |   ✅   |  ✅   |
| Resolve comments           |  ✅   |  ✅   |   ✅   |  ❌   |
| Manage widgets             |  ✅   |  ✅   |   ✅   |  ❌   |
| Install marketplace widgets |  ✅   |  ✅   |   ❌   |  ❌   |

The `ROLE_PERMISSIONS` map and `hasPermission()` helper are exported from `@lenzro/types/permission`.

---

## Guards and Decorators

```typescript
// Protect a route — requires valid access token
@UseGuards(JwtAuthGuard)

// Require a specific workspace permission
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@RequirePermission('page:edit')

// Get the current authenticated user
@CurrentUser() user: JwtPayload

// Skip auth on public routes
@Public()
```

---

## Security Considerations

| Concern                  | Mitigation                                                              |
|-------------------------|-------------------------------------------------------------------------|
| Token theft              | Short-lived access tokens (15 min); refresh tokens in HttpOnly cookies  |
| Refresh token replay     | Rotation + reuse detection; full revocation on anomaly                  |
| Brute force              | Rate limiting per IP and per email; exponential backoff                 |
| Password storage         | bcrypt with cost factor 12                                              |
| Email enumeration        | All auth responses return the same message regardless of email validity |
| CSRF                     | SameSite=Strict cookies; CSRF token for state-changing requests         |
| SQL injection            | Prisma ORM parameterises all queries                                    |
| XSS                      | Access tokens never stored in localStorage; Content-Security-Policy     |
