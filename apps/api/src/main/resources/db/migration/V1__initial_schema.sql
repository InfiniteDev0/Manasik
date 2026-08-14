-- ============================================================================
-- V1 — Identity, tenancy and auth
--
-- Model (ROADMAP D5):
--
--     users ──< memberships >── organizations
--                (role lives on the membership)
--
-- `users` is GLOBAL. It has no organization_id, because a person can belong to
-- several agencies, and a freshly registered person belongs to none.
-- ============================================================================

-- gen_random_uuid() is core since PostgreSQL 13, but pgcrypto is what provides
-- it on some managed platforms. Enabling it is a no-op where it's built in.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- users — a person, not a tenant
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    -- Globally unique: one account per email across the whole platform. Scoping
    -- email per-organization would make "which account am I logging into?"
    -- ambiguous before we know the organization.
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    avatar_url      TEXT,
    locale          VARCHAR(10)  NOT NULL DEFAULT 'en',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness. Without LOWER(), Ahmed@x.com and ahmed@x.com
-- become two accounts. The application also lowercases on write; this is the
-- guarantee that survives a bug in that code.
CREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email));

-- ----------------------------------------------------------------------------
-- organizations — the tenant (an agency's workspace)
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(150) NOT NULL,
    slug               VARCHAR(150) NOT NULL,
    logo_url           TEXT,

    country            CHAR(2)      NOT NULL,          -- ISO 3166-1 alpha-2
    currency           CHAR(3)      NOT NULL,          -- ISO 4217
    timezone           VARCHAR(64)  NOT NULL,          -- IANA, e.g. Africa/Nairobi

    organization_type  VARCHAR(20)
        CONSTRAINT ck_organizations_type
        CHECK (organization_type IN ('UMRAH', 'HAJJ', 'HAJJ_AND_UMRAH')),

    pilgrims_per_year  VARCHAR(20)
        CONSTRAINT ck_organizations_volume
        CHECK (pilgrims_per_year IN ('UNDER_100', 'FROM_100_TO_500', 'FROM_500_TO_2000', 'OVER_2000')),

    status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT ck_organizations_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),

    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_organizations_slug ON organizations (LOWER(slug));

-- ----------------------------------------------------------------------------
-- memberships — the join that makes multi-workspace possible
-- ----------------------------------------------------------------------------
CREATE TABLE memberships (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,

    role             VARCHAR(20) NOT NULL
        CONSTRAINT ck_memberships_role
        CHECK (role IN ('OWNER', 'ADMIN', 'OPERATIONS', 'SALES', 'FINANCE', 'GUIDE', 'SUPPORT')),

    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT ck_memberships_status
        CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED')),

    invited_at       TIMESTAMPTZ,
    joined_at        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- A person holds at most one membership per organization.
    CONSTRAINT ux_memberships_user_org UNIQUE (user_id, organization_id)
);

CREATE INDEX ix_memberships_user ON memberships (user_id);
CREATE INDEX ix_memberships_org  ON memberships (organization_id);

-- Exactly one OWNER per organization. A partial unique index enforces this in
-- the database, so a race between two "transfer ownership" requests can't
-- leave an agency with two owners or none.
CREATE UNIQUE INDEX ux_memberships_single_owner
    ON memberships (organization_id)
    WHERE role = 'OWNER';

-- ----------------------------------------------------------------------------
-- invitations — inviting someone who may not have an account yet
-- ----------------------------------------------------------------------------
CREATE TABLE invitations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    email            VARCHAR(255) NOT NULL,

    role             VARCHAR(20) NOT NULL
        CONSTRAINT ck_invitations_role
        -- OWNER absent on purpose: ownership is transferred, never invited.
        CHECK (role IN ('ADMIN', 'OPERATIONS', 'SALES', 'FINANCE', 'GUIDE', 'SUPPORT')),

    -- Hashed, never the raw token. A database leak must not hand out working
    -- invitation links.
    token_hash       VARCHAR(255) NOT NULL,
    invited_by       UUID REFERENCES users (id) ON DELETE SET NULL,
    expires_at       TIMESTAMPTZ NOT NULL,
    accepted_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_invitations_org ON invitations (organization_id);

-- Only one pending invite per email per organization; re-inviting replaces it.
CREATE UNIQUE INDEX ux_invitations_pending
    ON invitations (organization_id, LOWER(email))
    WHERE accepted_at IS NULL;

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,

    plan                    VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
        CONSTRAINT ck_subscriptions_plan
        CHECK (plan IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),

    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT ck_subscriptions_status
        CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),

    trial_ends_at           TIMESTAMPTZ,
    current_period_ends_at  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One subscription per organization.
    CONSTRAINT ux_subscriptions_org UNIQUE (organization_id)
);

-- ----------------------------------------------------------------------------
-- otp_tokens — email verification and password reset
-- ----------------------------------------------------------------------------
CREATE TABLE otp_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- Hashed. A leaked table must not yield usable codes.
    token_hash  VARCHAR(255) NOT NULL,

    purpose     VARCHAR(30) NOT NULL
        CONSTRAINT ck_otp_purpose
        CHECK (purpose IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),

    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    attempts    SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supports "fetch the latest token for this user and purpose", which is how
-- verification distinguishes "wrong code" from "already used".
CREATE INDEX ix_otp_user_purpose ON otp_tokens (user_id, purpose, created_at DESC);

-- ----------------------------------------------------------------------------
-- refresh_sessions — replaces Redis for refresh-token JTIs
--
-- Rotation: on every refresh the current row is deleted and a new one written.
-- Reuse detection: presenting a JTI that is absent means the token was already
-- rotated, i.e. it leaked — revoke every session for that user.
-- ----------------------------------------------------------------------------
CREATE TABLE refresh_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

    -- The `jti` claim of the refresh token.
    jti         UUID NOT NULL,

    -- Which workspace this session was operating in when issued. Nullable: a
    -- user with no membership still gets a valid session.
    organization_id UUID REFERENCES organizations (id) ON DELETE SET NULL,

    user_agent  VARCHAR(255),
    ip_address  VARCHAR(45),                    -- fits IPv6
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ux_refresh_sessions_jti UNIQUE (jti)
);

CREATE INDEX ix_refresh_sessions_user ON refresh_sessions (user_id);
-- Lets a scheduled job clear expired rows cheaply.
CREATE INDEX ix_refresh_sessions_expiry ON refresh_sessions (expires_at);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Nullable so the actor's account can be deleted without destroying the
    -- audit trail. An audit row that vanishes with its subject is worthless.
    actor_user_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    organization_id  UUID REFERENCES organizations (id) ON DELETE CASCADE,

    action           VARCHAR(100) NOT NULL,      -- e.g. MEMBER_INVITED
    entity           VARCHAR(100),               -- e.g. Pilgrim
    entity_id        UUID,
    metadata         JSONB,
    ip_address       VARCHAR(45),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_logs_org  ON audit_logs (organization_id, created_at DESC);
CREATE INDEX ix_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
