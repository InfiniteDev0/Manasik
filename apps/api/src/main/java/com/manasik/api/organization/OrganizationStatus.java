package com.manasik.api.organization;

/** Mirrors {@code ck_organizations_status}. */
public enum OrganizationStatus {
    ACTIVE,
    /** Access blocked — non-payment or policy — but data retained. */
    SUSPENDED,
    /** Closed by the customer. Retained for the statutory window, then purged. */
    CANCELLED
}
