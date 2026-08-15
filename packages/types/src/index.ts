export type * from './organization';
export type * from './membership';
export type * from './user';
export type * from './permission';

// Runtime values (not just types) need a value export.
export { ROLES, INVITABLE_ROLES } from './membership';
export {
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './permission';

// ─────────────────────────────────────────────
// NOTE (ROADMAP D4)
// ─────────────────────────────────────────────
// Hand-written for now. From Phase 5 these are generated from the Spring API's
// OpenAPI spec (`pnpm gen:api-types`), so a backend field rename becomes a
// compile error here instead of a runtime bug in the browser.
