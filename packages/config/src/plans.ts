// ─────────────────────────────────────────────
// Subscription plans
// ─────────────────────────────────────────────
//
// ⚠️ PROVISIONAL — the limits below are placeholders so the types exist and the
// onboarding "Choose Subscription" step can be built against something real.
// Actual tiers, limits, and pricing are Yussuf's call and are not decided yet.
// Revisit before the billing phase.
//
// `-1` means unlimited.

export const PLAN_LIMITS = {
  STARTER: { maxUsers: 5, maxPilgrimsPerYear: 500, maxPackages: 10, maxStorageGb: 5 },
  PROFESSIONAL: { maxUsers: 25, maxPilgrimsPerYear: 5000, maxPackages: -1, maxStorageGb: 50 },
  ENTERPRISE: { maxUsers: -1, maxPilgrimsPerYear: -1, maxPackages: -1, maxStorageGb: -1 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export const PLAN_KEYS = Object.keys(PLAN_LIMITS) as PlanKey[];

export const isUnlimited = (limit: number): boolean => limit === -1;

// ─────────────────────────────────────────────
// Optional modules (onboarding step 3)
// ─────────────────────────────────────────────

export const MODULES = [
  'pilgrims',
  'packages',
  'payments',
  'hotels',
  'transport',
  'flights',
  'crm',
] as const;

export type ModuleKey = (typeof MODULES)[number];
