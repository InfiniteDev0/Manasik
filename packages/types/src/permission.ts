import type { Role } from './membership';

// ─────────────────────────────────────────────
// Permissions — RESOURCE_ACTION, never role checks
// ─────────────────────────────────────────────
//
// Code must ask "can this person do X?", not "is this person a GUIDE?".
// Writing `if (role === 'GUIDE')` bakes today's role list into every call site;
// adding a role later then means hunting down every such branch. Ask for the
// permission and the role table stays the only thing that changes.
//
// ⚠️ This map ships to the browser and is trivially editable there. It decides
// what to RENDER. The Spring API is the only authority on access — every
// endpoint enforces its own rule. Hiding a button without guarding the
// endpoint is not access control.

export type Permission =
  // Organization & platform admin
  | 'ORGANIZATION_VIEW'
  | 'ORGANIZATION_EDIT'
  | 'ORGANIZATION_DELETE'
  | 'BILLING_VIEW'
  | 'BILLING_MANAGE'
  | 'MEMBER_VIEW'
  | 'MEMBER_INVITE'
  | 'MEMBER_EDIT'
  | 'MEMBER_REMOVE'
  | 'AUDIT_LOG_VIEW'
  // CRM
  | 'LEAD_VIEW' | 'LEAD_CREATE' | 'LEAD_EDIT' | 'LEAD_DELETE'
  | 'CUSTOMER_VIEW' | 'CUSTOMER_CREATE' | 'CUSTOMER_EDIT' | 'CUSTOMER_DELETE'
  // Pilgrims
  | 'PILGRIM_VIEW' | 'PILGRIM_CREATE' | 'PILGRIM_EDIT' | 'PILGRIM_DELETE'
  // Commercial
  | 'PACKAGE_VIEW' | 'PACKAGE_CREATE' | 'PACKAGE_EDIT' | 'PACKAGE_DELETE'
  | 'BOOKING_VIEW' | 'BOOKING_CREATE' | 'BOOKING_EDIT' | 'BOOKING_CANCEL'
  // Operations
  | 'GROUP_VIEW' | 'GROUP_CREATE' | 'GROUP_EDIT' | 'GROUP_DELETE'
  | 'HOTEL_VIEW' | 'HOTEL_MANAGE'
  | 'TRANSPORT_VIEW' | 'TRANSPORT_MANAGE'
  | 'FLIGHT_VIEW' | 'FLIGHT_MANAGE'
  // Finance
  | 'PAYMENT_VIEW' | 'PAYMENT_CREATE' | 'PAYMENT_REFUND'
  | 'INVOICE_VIEW' | 'INVOICE_CREATE' | 'INVOICE_SEND'
  // Shared
  | 'DOCUMENT_VIEW' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DELETE'
  | 'TASK_VIEW' | 'TASK_CREATE' | 'TASK_EDIT'
  | 'COMMUNICATION_SEND'
  | 'REPORT_VIEW';

// ─────────────────────────────────────────────
// Role bundles
// ─────────────────────────────────────────────

const OPERATIONS_PERMISSIONS: Permission[] = [
  'ORGANIZATION_VIEW', 'MEMBER_VIEW',
  'PILGRIM_VIEW', 'PILGRIM_CREATE', 'PILGRIM_EDIT',
  'CUSTOMER_VIEW', 'CUSTOMER_EDIT',
  'PACKAGE_VIEW',
  'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_EDIT',
  'GROUP_VIEW', 'GROUP_CREATE', 'GROUP_EDIT', 'GROUP_DELETE',
  'HOTEL_VIEW', 'HOTEL_MANAGE',
  'TRANSPORT_VIEW', 'TRANSPORT_MANAGE',
  'FLIGHT_VIEW', 'FLIGHT_MANAGE',
  'DOCUMENT_VIEW', 'DOCUMENT_UPLOAD',
  'TASK_VIEW', 'TASK_CREATE', 'TASK_EDIT',
  'COMMUNICATION_SEND',
];

const SALES_PERMISSIONS: Permission[] = [
  'ORGANIZATION_VIEW', 'MEMBER_VIEW',
  'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_EDIT', 'LEAD_DELETE',
  'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT',
  'PILGRIM_VIEW', 'PILGRIM_CREATE',
  'PACKAGE_VIEW',
  'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_EDIT',
  'DOCUMENT_VIEW',
  'TASK_VIEW', 'TASK_CREATE', 'TASK_EDIT',
  'COMMUNICATION_SEND',
];

const FINANCE_PERMISSIONS: Permission[] = [
  'ORGANIZATION_VIEW', 'MEMBER_VIEW',
  'CUSTOMER_VIEW', 'PILGRIM_VIEW', 'PACKAGE_VIEW', 'BOOKING_VIEW',
  'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_REFUND',
  'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_SEND',
  'DOCUMENT_VIEW',
  'TASK_VIEW',
  'REPORT_VIEW',
];

// A guide sees only what they need for the group in front of them.
const GUIDE_PERMISSIONS: Permission[] = [
  'ORGANIZATION_VIEW',
  'GROUP_VIEW',
  'PILGRIM_VIEW',
  'HOTEL_VIEW',
  'TRANSPORT_VIEW',
  'FLIGHT_VIEW',
  'DOCUMENT_VIEW',
  'TASK_VIEW', 'TASK_EDIT',
];

const SUPPORT_PERMISSIONS: Permission[] = [
  'ORGANIZATION_VIEW', 'MEMBER_VIEW',
  'CUSTOMER_VIEW', 'CUSTOMER_EDIT',
  'PILGRIM_VIEW', 'PILGRIM_EDIT',
  'PACKAGE_VIEW', 'BOOKING_VIEW',
  'DOCUMENT_VIEW',
  'TASK_VIEW', 'TASK_CREATE', 'TASK_EDIT',
  'COMMUNICATION_SEND',
];

// Everything operational, plus member management. No billing, no deletion of
// the organization itself — those stay with the owner.
const ADMIN_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    'ORGANIZATION_VIEW', 'ORGANIZATION_EDIT',
    'MEMBER_VIEW', 'MEMBER_INVITE', 'MEMBER_EDIT', 'MEMBER_REMOVE',
    'AUDIT_LOG_VIEW',
    ...OPERATIONS_PERMISSIONS,
    ...SALES_PERMISSIONS,
    ...FINANCE_PERMISSIONS,
    'LEAD_DELETE', 'CUSTOMER_DELETE', 'PILGRIM_DELETE',
    'PACKAGE_CREATE', 'PACKAGE_EDIT', 'PACKAGE_DELETE',
    'BOOKING_CANCEL',
    'DOCUMENT_DELETE',
    'REPORT_VIEW',
  ]),
);

const OWNER_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    ...ADMIN_PERMISSIONS,
    'ORGANIZATION_DELETE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
  ]),
);

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  OPERATIONS: OPERATIONS_PERMISSIONS,
  SALES: SALES_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
  GUIDE: GUIDE_PERMISSIONS,
  SUPPORT: SUPPORT_PERMISSIONS,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) {
    return false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: Role | null, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role | null, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
