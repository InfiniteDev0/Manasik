package com.manasik.api.organization;

/**
 * A member's role <em>within one organization</em>.
 *
 * <p>Lives on {@code Membership}, not {@code User} — the same person can be
 * OWNER of one agency and GUIDE at another.
 *
 * <p>Authorization must never branch on this directly. Ask for a permission
 * ({@code PILGRIM_CREATE}) instead; otherwise today's role list gets baked into
 * every call site and adding a role means hunting them all down.
 *
 * <p>Mirrors {@code ck_memberships_role}.
 */
public enum Role {
    /** Everything, including billing and deleting the organization. One per organization. */
    OWNER,
    /** Everything except billing and ownership. */
    ADMIN,
    /** Pilgrims, bookings, groups, packages, hotels, transport. */
    OPERATIONS,
    /** CRM: leads, customers, packages, bookings. */
    SALES,
    /** Payments, invoices, refunds, financial reports. */
    FINANCE,
    /** Only their assigned groups, those pilgrims, and schedules. */
    GUIDE,
    /** Customer and pilgrim information, plus communication. */
    SUPPORT
}
