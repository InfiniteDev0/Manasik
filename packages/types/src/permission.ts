import type { Role } from './agency';

// ─────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────
//
// ⚠️ This map is a UI convenience — it decides what to render, nothing more.
// It ships to the browser and is therefore trivially editable by the user.
//
// The Spring API is the only authority on access. Every endpoint must enforce
// its own rule (@PreAuthorize / method security). Hiding a button here without
// guarding the endpoint there is not access control.

export type Permission =
  // Agency & platform administration
  | 'agency:read'
  | 'agency:update'
  | 'agency:manage_billing'
  | 'agency:manage_members'
  | 'agency:view_audit_log'
  // Pilgrims (CRM)
  | 'pilgrim:read'
  | 'pilgrim:create'
  | 'pilgrim:update'
  | 'pilgrim:delete'
  // Packages & bookings
  | 'package:read'
  | 'package:write'
  | 'booking:read'
  | 'booking:write'
  // Operations
  | 'group:read'
  | 'group:write'
  | 'hotel:read'
  | 'hotel:write'
  | 'transport:read'
  | 'transport:write'
  | 'flight:read'
  | 'flight:write'
  // Finance
  | 'payment:read'
  | 'payment:write'
  | 'payment:refund'
  // Shared
  | 'document:read'
  | 'document:write'
  | 'task:read'
  | 'task:write'
  | 'communication:send'
  | 'report:read';

const OPERATIONS_PERMISSIONS: Permission[] = [
  'pilgrim:read',
  'pilgrim:create',
  'pilgrim:update',
  'package:read',
  'booking:read',
  'booking:write',
  'group:read',
  'group:write',
  'hotel:read',
  'hotel:write',
  'transport:read',
  'transport:write',
  'flight:read',
  'flight:write',
  'document:read',
  'document:write',
  'task:read',
  'task:write',
  'communication:send',
];

const FINANCE_PERMISSIONS: Permission[] = [
  'pilgrim:read',
  'package:read',
  'booking:read',
  'payment:read',
  'payment:write',
  'payment:refund',
  'document:read',
  'report:read',
  'task:read',
];

// A guide sees only what they need for the group in front of them.
const GUIDE_PERMISSIONS: Permission[] = [
  'group:read',
  'pilgrim:read',
  'task:read',
  'task:write',
  'document:read',
];

const SUPPORT_PERMISSIONS: Permission[] = [
  'pilgrim:read',
  'pilgrim:update',
  'package:read',
  'booking:read',
  'document:read',
  'task:read',
  'task:write',
  'communication:send',
];

const ADMIN_PERMISSIONS: Permission[] = [
  'agency:read',
  'agency:update',
  'agency:manage_members',
  ...OPERATIONS_PERMISSIONS,
  ...FINANCE_PERMISSIONS,
  'report:read',
];

// ─────────────────────────────────────────────
// Role → permission mapping
// ─────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // The owner can do everything, including billing and deleting the agency.
  OWNER: [
    'agency:read',
    'agency:update',
    'agency:manage_billing',
    'agency:manage_members',
    'agency:view_audit_log',
    ...ADMIN_PERMISSIONS,
  ],
  ADMIN: ADMIN_PERMISSIONS,
  OPERATIONS: OPERATIONS_PERMISSIONS,
  FINANCE: FINANCE_PERMISSIONS,
  GUIDE: GUIDE_PERMISSIONS,
  SUPPORT: SUPPORT_PERMISSIONS,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
