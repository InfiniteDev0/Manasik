import type { Role, MembershipSummary } from './membership';

// ─────────────────────────────────────────────
// User — a person, not a tenant
// ─────────────────────────────────────────────
//
// Deliberately has NO organizationId. A user reaches organizations through
// Membership, so this record stays valid whether they belong to zero agencies
// (just registered) or several.
//
// Timestamps are `string`, not `Date`: these describe JSON from the Spring API,
// and Jackson serializes Instant/OffsetDateTime to ISO-8601 strings.

// Mirrors AuthResponse.UserResponse in the API exactly. `updatedAt` is
// deliberately absent — the API does not expose it, and declaring a field the
// server never sends produces `undefined` at runtime with no type error.
export interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Safe projection for showing other people (member lists, assignees). */
export interface PublicUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

// ─────────────────────────────────────────────
// Auth responses
// ─────────────────────────────────────────────

/**
 * POST /v1/auth/login.
 *
 * The refresh token is delivered as an HttpOnly cookie and never appears in a
 * response body.
 *
 * `memberships` drives the post-login fork: empty means send them to
 * /create-workspace; otherwise open the active one.
 */
export interface AuthResponse {
  accessToken: string;
  user: User;
  memberships: MembershipSummary[];
  /** null when the user has no organization yet. */
  activeOrganizationId: string | null;
}

export interface MeResponse {
  user: User;
  memberships: MembershipSummary[];
  activeOrganizationId: string | null;
}

export interface RefreshResponse {
  accessToken: string;
}

/**
 * Decoded access-token claims.
 *
 * `organizationId` is the ACTIVE organization and is what drives tenant
 * isolation server-side. Switching workspace re-issues the token; the client
 * never asserts a tenant on its own.
 */
export interface JwtPayload {
  sub: string;
  organizationId: string | null;
  role: Role | null;
  jti: string;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
//
// Deliberately minimal (per the v1 auth spec): a person creates an account,
// then creates or joins a workspace as a separate step. No agency fields here.

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  acceptTerms: true;
}

export interface LoginInput {
  email: string;
  password: string;
}
