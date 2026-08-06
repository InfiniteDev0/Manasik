export type * from './agency';
export type * from './user';
export type * from './permission';

// Runtime values (not just types) need a value export.
export { ROLES } from './agency';
export { ROLE_PERMISSIONS, hasPermission, hasAnyPermission } from './permission';

// ─────────────────────────────────────────────
// NOTE (ROADMAP D4)
// ─────────────────────────────────────────────
// These interfaces are hand-written for now so Phase 0 compiles. From Phase 5
// they are replaced by types generated from the Spring API's OpenAPI spec
// (`pnpm gen:api-types`), which makes backend field renames a compile error
// here instead of a runtime bug in the browser.
