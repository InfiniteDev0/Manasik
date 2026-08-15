-- ============================================================================
-- V4 — Pilgrims
--
-- The first BUSINESS table, and the template every later one follows:
--   1. organization_id NOT NULL, referencing organizations
--   2. ENABLE + FORCE row level security
--   3. a tenant-isolation policy
--
-- Steps 2 and 3 are not optional and must live in the same migration that
-- creates the table. A business table added without them is readable across
-- every agency on the platform.
-- ============================================================================

CREATE TABLE pilgrims (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,

    -- ── Identity ────────────────────────────────────────────────────────────
    full_name             VARCHAR(150) NOT NULL,
    -- Arabic spelling as it appears on the passport. Kept separate because
    -- Saudi visa paperwork requires it and transliteration is not reversible.
    arabic_name           VARCHAR(150),

    gender                VARCHAR(10) NOT NULL
        CONSTRAINT ck_pilgrims_gender CHECK (gender IN ('MALE', 'FEMALE')),

    date_of_birth         DATE,
    nationality           CHAR(2),                      -- ISO 3166-1 alpha-2

    -- ── Contact ─────────────────────────────────────────────────────────────
    email                 VARCHAR(255),
    phone                 VARCHAR(20),
    address               TEXT,
    city                  VARCHAR(100),
    country               CHAR(2),

    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    -- Free text on purpose: "brother", "daughter-in-law", "neighbour" — an
    -- enum here would be guessing at families.
    emergency_contact_relation VARCHAR(50),

    -- ── Travel documents ────────────────────────────────────────────────────
    passport_number       VARCHAR(50),
    passport_expiry       DATE,
    passport_issue_country CHAR(2),

    visa_number           VARCHAR(50),
    visa_status           VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'
        CONSTRAINT ck_pilgrims_visa_status
        CHECK (visa_status IN ('NOT_STARTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED')),
    visa_expiry           DATE,

    -- ── Pilgrimage ──────────────────────────────────────────────────────────
    pilgrimage_type       VARCHAR(20) NOT NULL DEFAULT 'UMRAH'
        CONSTRAINT ck_pilgrims_type CHECK (pilgrimage_type IN ('UMRAH', 'HAJJ')),

    status                VARCHAR(20) NOT NULL DEFAULT 'LEAD'
        CONSTRAINT ck_pilgrims_status
        CHECK (status IN ('LEAD', 'REGISTERED', 'CONFIRMED', 'TRAVELLING', 'COMPLETED', 'CANCELLED')),

    -- ── Operational ─────────────────────────────────────────────────────────
    medical_notes         TEXT,
    -- Wheelchair access, ground-floor room, dietary needs. Drives room and
    -- transport assignment later.
    special_requirements  TEXT,
    notes                 TEXT,
    photo_url             TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every list, search and filter is scoped to one agency, so organization_id
-- leads each index. An index that does not start with it cannot serve a
-- tenant-filtered query.
CREATE INDEX ix_pilgrims_org_created ON pilgrims (organization_id, created_at DESC);
CREATE INDEX ix_pilgrims_org_status  ON pilgrims (organization_id, status);
CREATE INDEX ix_pilgrims_org_visa    ON pilgrims (organization_id, visa_status);

-- Case-insensitive name search. text_pattern_ops supports prefix matching
-- (LIKE 'ahmed%'), which is what a type-ahead search box actually issues.
CREATE INDEX ix_pilgrims_org_name ON pilgrims (organization_id, LOWER(full_name) text_pattern_ops);

-- A passport number is unique per agency, not globally: two agencies may
-- legitimately both hold records for the same person. Partial, because the
-- number is optional while a pilgrim is still a lead.
CREATE UNIQUE INDEX ux_pilgrims_org_passport
    ON pilgrims (organization_id, UPPER(passport_number))
    WHERE passport_number IS NOT NULL;

-- ── Tenant isolation ────────────────────────────────────────────────────────
ALTER TABLE pilgrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilgrims FORCE ROW LEVEL SECURITY;

CREATE POLICY pilgrims_tenant_isolation ON pilgrims
    USING (organization_id = manasik.app_current_organization())
    WITH CHECK (organization_id = manasik.app_current_organization());

-- V3 granted privileges on tables existing at the time, and set default
-- privileges for future ones — so manasik_app already has access here. This
-- is belt-and-braces in case those defaults are ever altered.
GRANT SELECT, INSERT, UPDATE, DELETE ON pilgrims TO manasik_app;
