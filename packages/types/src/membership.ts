// ─────────────────────────────────────────────
// Membership — the join between User and Organization
// ─────────────────────────────────────────────
//
// This is the table that makes multi-workspace possible. Role lives HERE, not
// on the user: Ahmed can be OWNER of Baraka Travels and GUIDE at another
// agency simultaneously.

export type Role =
  | 'OWNER'      // everything, including billing and transferring ownership
  | 'ADMIN'      // everything except ownership and billing
  | 'OPERATIONS' // pilgrims, bookings, groups, packages, hotels, transport
  | 'SALES'      // CRM, leads, customers, packages, bookings
  | 'FINANCE'    // payments, invoices, financial reports
  | 'GUIDE'      // assigned groups, their pilgrims, schedules
  | 'SUPPORT';   // customer/pilgrim info and communication

export const ROLES: readonly Role[] = [
  'OWNER',
  'ADMIN',
  'OPERATIONS',
  'SALES',
  'FINANCE',
  'GUIDE',
  'SUPPORT',
];

/** Roles assignable when inviting someone. OWNER is transferred, not granted. */
export const INVITABLE_ROLES: readonly Role[] = ROLES.filter((r) => r !== 'OWNER');

export type MembershipStatus =
  | 'INVITED'  // invitation sent, not yet accepted
  | 'ACTIVE'
  | 'SUSPENDED';

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A membership with its organization inlined — what the workspace switcher
 * needs, so it can render names without a second request per organization.
 */
export interface MembershipSummary {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  logoUrl: string | null;
  role: Role;
  status: MembershipStatus;
}

export interface InviteMemberInput {
  email: string;
  role: Exclude<Role, 'OWNER'>;
}
