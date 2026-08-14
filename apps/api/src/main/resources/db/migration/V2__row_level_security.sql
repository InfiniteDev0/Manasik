-- ============================================================================
-- V2 — Row-Level Security
--
-- This is the DATABASE-LEVEL backstop for tenant isolation (ROADMAP D2).
-- Hibernate's @TenantId already filters reads and stamps writes; RLS exists so
-- that a hand-written query, a native SQL block, or a bug in the tenant context
-- still cannot return another agency's rows.
--
-- Two settings are established per connection by the application:
--     app.current_organization  -- the active organization from the JWT
--     app.current_user_id       -- the authenticated user
--
-- `current_setting(..., true)` returns NULL rather than raising when unset, and
-- `column = NULL` is never true — so an unconfigured connection sees NOTHING.
-- That is deliberate: the failure mode is empty results, not leaked rows.
--
-- ---------------------------------------------------------------------------
-- ⚠️ SUPABASE CAVEAT — verify, do not assume.
--
-- RLS does not apply to a table's OWNER unless FORCE ROW LEVEL SECURITY is set,
-- and it is bypassed entirely by any role holding BYPASSRLS. On Supabase you
-- connect as `postgres`, which owns these tables. Hence FORCE below.
--
-- If `postgres` turns out to hold BYPASSRLS on your project, FORCE is not
-- enough and RLS is decorative. Checkpoint 3's raw-JDBC test is what proves
-- which of those is true — do not tick that checkpoint off by inspection.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: the active organization, or NULL.
-- ----------------------------------------------------------------------------
-- Schema-qualified on purpose: a policy resolves the function when it is
-- created, but being explicit means an altered search_path later can never
-- point these policies at a different function of the same name.
CREATE OR REPLACE FUNCTION manasik.app_current_organization()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_organization', true), '')::UUID;
$$;

COMMENT ON FUNCTION manasik.app_current_organization() IS
    'Active organization for this connection, set by the application from the JWT. NULL when unset, which makes every RLS policy match zero rows.';

-- ============================================================================
-- Tenant-scoped tables — RLS ON
-- ============================================================================

-- invitations -----------------------------------------------------------------
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;

CREATE POLICY invitations_tenant_isolation ON invitations
    USING (organization_id = manasik.app_current_organization())
    WITH CHECK (organization_id = manasik.app_current_organization());

-- subscriptions ---------------------------------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_tenant_isolation ON subscriptions
    USING (organization_id = manasik.app_current_organization())
    WITH CHECK (organization_id = manasik.app_current_organization());

-- audit_logs ------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (organization_id = manasik.app_current_organization())
    WITH CHECK (organization_id = manasik.app_current_organization());

-- ============================================================================
-- Deliberately EXEMPT — and why.
--
-- These are not oversights. Each one is queried across tenant boundaries as a
-- normal part of the product, so an organization_id policy would break it.
-- Access control for these lives in the application layer.
--
--   users             Global by design (D5). Someone with zero memberships must
--                     still be able to log in — an org-scoped policy would make
--                     registration and login impossible.
--
--   organizations     The workspace switcher lists every organization the user
--                     belongs to. Filtering to the ACTIVE one would show a user
--                     only the workspace they are already in.
--
--   memberships       Same reason, and it is the table that answers "which
--                     organizations does this person belong to?" — inherently a
--                     cross-tenant question.
--
--   otp_tokens        Scoped to a USER, not an organization. Used during email
--                     verification, before any organization exists.
--
--   refresh_sessions  Scoped to a USER. A session outlives any single active
--                     organization and exists before the first one is created.
--
-- Every future BUSINESS table (pilgrims, bookings, packages, groups, hotels,
-- payments, documents, tasks...) is tenant-scoped and MUST get the same three
-- statements as above. Add them in the migration that creates the table, not
-- afterwards.
-- ============================================================================
