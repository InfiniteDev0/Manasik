-- Runs once as the container superuser, before Spring or Flyway start.
--
-- This recreates the essential property of the production setup: the
-- application connects as a role that is NOT a superuser and does NOT hold
-- BYPASSRLS, so row-level security actually applies to it.
--
-- Without this the tests would run as the container's default superuser, RLS
-- would be bypassed entirely, and the isolation assertions would pass for
-- completely the wrong reason — the worst possible outcome for a security test.
CREATE ROLE manasik_app WITH LOGIN PASSWORD 'test_app_password'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
