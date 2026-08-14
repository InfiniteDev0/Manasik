package com.manasik.api.organization;

/** Mirrors {@code ck_memberships_status}. */
public enum MembershipStatus {
    /** Invitation sent, not yet accepted. Grants no access. */
    INVITED,
    ACTIVE,
    /** Access revoked without deleting history of what they did. */
    SUSPENDED
}
