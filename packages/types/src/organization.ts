// ─────────────────────────────────────────────
// Organization — the tenant (an agency's workspace)
// ─────────────────────────────────────────────
//
// A User does NOT belong to an Organization directly. The link is a
// Membership, so one person can belong to several agencies:
//
//   User ──< Membership >── Organization
//
// Every organization-owned entity carries `organizationId`. Tenant isolation
// is enforced server-side from the ACTIVE organization on the JWT — never from
// anything the client sends.

export type OrganizationType = 'UMRAH' | 'HAJJ' | 'HAJJ_AND_UMRAH';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

/** Banded rather than exact — it's a sizing signal, not an accounting figure. */
export type PilgrimVolume = 'UNDER_100' | 'FROM_100_TO_500' | 'FROM_500_TO_2000' | 'OVER_2000';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;

  country: string;
  currency: string;
  timezone: string;

  organizationType: OrganizationType | null;
  pilgrimsPerYear: PilgrimVolume | null;

  status: OrganizationStatus;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────

export type SubscriptionPlan = 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
}

// ─────────────────────────────────────────────
// Create-workspace wizard input
// ─────────────────────────────────────────────

/** Step 1 — the minimum needed to create the workspace. */
export interface CreateOrganizationInput {
  name: string;
  country: string;
  currency: string;
  timezone: string;
}

/** Step 2 — profile detail, all optional so the step can be skipped. */
export interface OrganizationProfileInput {
  organizationType?: OrganizationType;
  pilgrimsPerYear?: PilgrimVolume;
}
