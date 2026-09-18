-- ============================================================================
-- V5 — Denormalize the current plan onto organizations
--
-- `subscriptions` remains the billing record (status, trial end, period end).
-- This column is a DISPLAY copy of which tier the workspace is on.
--
-- Why duplicate it:
--
--   subscriptions is RLS-scoped to the ACTIVE organization, so it can only be
--   read for the workspace you are currently in. The UI needs the plan in two
--   places where that is not true:
--
--     1. the workspace switcher, which lists EVERY workspace you belong to
--     2. login, which happens before any tenant is set on the connection
--
--   organizations is deliberately exempt from RLS (D6) precisely because it is
--   queried across tenants, so putting the plan here makes both cases work
--   without weakening isolation.
--
-- ⚠️ The cost is two sources of truth. Whatever changes a subscription's plan
-- MUST update this column in the same transaction. A single writer (the future
-- billing service) keeps that honest; scattered updates will drift.
-- ============================================================================

ALTER TABLE organizations
    ADD COLUMN plan VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
        CONSTRAINT ck_organizations_plan
        CHECK (plan IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'));

-- Backfill from the existing subscription rows so the two agree from the
-- start. Runs as the Flyway (owner) role, which is not subject to the
-- subscriptions RLS policy.
UPDATE organizations o
SET plan = s.plan
FROM subscriptions s
WHERE s.organization_id = o.id;

COMMENT ON COLUMN organizations.plan IS
    'Display copy of subscriptions.plan. Update both together - see V5 migration.';
