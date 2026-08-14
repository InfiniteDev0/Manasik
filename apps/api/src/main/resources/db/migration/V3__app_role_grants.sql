-- ============================================================================
-- V3 — Privileges for the runtime application role
--
-- WHY THIS EXISTS
--
-- Verified on this project 2026-08-10:
--
--     postgres_bypassrls = true
--
-- BYPASSRLS overrides even FORCE ROW LEVEL SECURITY. So while the application
-- connects as `postgres`, the policies in V2 filter NOTHING and D2's
-- database-level backstop is decorative.
--
-- The fix is to separate the two identities:
--
--     Flyway   → postgres      owns the tables, needs DDL, BYPASSRLS is fine
--     Runtime  → manasik_app   owns nothing, NOBYPASSRLS → RLS actually applies
--
-- `manasik_app` must be created first (it carries a password, so it cannot live
-- in a committed migration):
--
--     create role manasik_app with login password '...'
--       nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
--     grant connect on database postgres to manasik_app;
--
-- This migration only grants privileges, and deliberately grants NO DDL: the
-- runtime role must never be able to alter the schema Flyway owns.
-- ============================================================================

-- Fail loudly and usefully rather than granting into the void.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'manasik_app') THEN
        RAISE EXCEPTION
            'Role "manasik_app" does not exist. Create it in the Supabase SQL Editor before starting the app - see the header of V3__app_role_grants.sql.';
    END IF;

    -- A role that can bypass RLS defeats the entire point of V2. Catch a
    -- mis-created role now rather than discovering it via a data leak.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'manasik_app' AND rolbypassrls) THEN
        RAISE EXCEPTION
            'Role "manasik_app" has BYPASSRLS, which disables row-level security. Fix with: ALTER ROLE manasik_app NOBYPASSRLS;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'manasik_app' AND rolsuper) THEN
        RAISE EXCEPTION
            'Role "manasik_app" is a superuser, which bypasses row-level security. Fix with: ALTER ROLE manasik_app NOSUPERUSER;';
    END IF;
END $$;

-- Read the schema, but not create in it.
GRANT USAGE ON SCHEMA manasik TO manasik_app;

-- Data access on everything that exists today.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA manasik
    TO manasik_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA manasik TO manasik_app;

GRANT EXECUTE ON FUNCTION manasik.app_current_organization() TO manasik_app;

-- ...and on everything Flyway creates from here on. Without this, every future
-- migration silently produces a table the application cannot read, and the
-- failure only shows up at runtime as a permission error.
ALTER DEFAULT PRIVILEGES IN SCHEMA manasik
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO manasik_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA manasik
    GRANT USAGE, SELECT ON SEQUENCES TO manasik_app;

-- The runtime role must NOT read Flyway's own bookkeeping.
REVOKE ALL ON manasik.flyway_schema_history FROM manasik_app;

-- Explicitly withhold DDL. Ownership already implies this, but stating it
-- documents the intent and survives someone loosening defaults later.
REVOKE CREATE ON SCHEMA manasik FROM manasik_app;
