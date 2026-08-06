import type { Role } from './agency';

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────
//
// Timestamps are `string`, not `Date`. These shapes describe what comes back
// over JSON from the Spring API, and JSON has no Date type — Jackson serializes
// Instant/OffsetDateTime to an ISO-8601 string. Parse at the edge if you need a
// real Date.

export interface User {
  id: string;
  agencyId: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  isVerified: boolean;
  avatarUrl: string | null;
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Safe projection for showing other people in the UI (member lists, assignees).
export interface PublicUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

// What POST /v1/auth/login and /v1/auth/verify-email return.
// The refresh token is delivered as an HttpOnly cookie and deliberately never
// appears in a response body.
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

// Decoded access-token claims. `agencyId` is what drives tenant isolation
// server-side — the client must never send a tenant id of its own.
export interface JwtPayload {
  sub: string;
  agencyId: string;
  role: Role;
  jti: string;
  iat?: number;
  exp?: number;
}
