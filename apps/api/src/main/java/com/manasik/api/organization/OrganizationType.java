package com.manasik.api.organization;

/**
 * What the agency actually sells.
 *
 * <p>Values must match the {@code ck_organizations_type} check constraint in
 * {@code V1__initial_schema.sql}. Adding one here without a matching migration
 * produces a constraint violation at insert time, not at startup.
 */
public enum OrganizationType {
    UMRAH,
    HAJJ,
    HAJJ_AND_UMRAH
}
