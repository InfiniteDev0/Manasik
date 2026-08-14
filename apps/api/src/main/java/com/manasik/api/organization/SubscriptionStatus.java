package com.manasik.api.organization;

/** Mirrors {@code ck_subscriptions_status}. */
public enum SubscriptionStatus {
    ACTIVE,
    /** Payment failed; access usually continues through a grace period. */
    PAST_DUE,
    /** Cancelled by the customer, still inside the paid period. */
    CANCELLED,
    /** Period ended without renewal. */
    EXPIRED
}
