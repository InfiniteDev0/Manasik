// ─────────────────────────────────────────────
// Agency — the tenant
// ─────────────────────────────────────────────
//
// Every row in the system belongs to exactly one agency. See ROADMAP D2:
// isolation is enforced by Hibernate `@TenantId` plus Postgres RLS, driven by
// the `agencyId` claim on the JWT.

export type Role = 'OWNER' | 'ADMIN' | 'OPERATIONS' | 'FINANCE' | 'GUIDE' | 'SUPPORT';

export const ROLES: readonly Role[] = [
  'OWNER',
  'ADMIN',
  'OPERATIONS',
  'FINANCE',
  'GUIDE',
  'SUPPORT',
];

export type AgencyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;

  country: string;
  city: string | null;
  address: string | null;

  licenseNumber: string | null;
  employeeCount: number | null;
  pilgrimsPerYear: number | null;

  timezone: string;
  currency: string;
  status: AgencyStatus;

  createdAt: string;
  updatedAt: string;
}

// What the onboarding wizard collects, step by step.
export interface AgencyProfileInput {
  name: string;
  logoUrl?: string | null;
  country: string;
  city?: string;
  address?: string;
}

export interface AgencyBusinessInput {
  licenseNumber?: string;
  employeeCount?: number;
  pilgrimsPerYear?: number;
}
