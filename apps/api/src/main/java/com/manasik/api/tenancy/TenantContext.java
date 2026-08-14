package com.manasik.api.tenancy;

import java.util.Optional;
import java.util.UUID;

/**
 * Holds the active organization and user for the current request thread.
 *
 * <h2>Why this class is dangerous</h2>
 *
 * Tomcat reuses threads. If a request sets the tenant and does not clear it,
 * the <em>next</em> request served by that thread starts with the previous
 * agency's id already in place. If that request is unauthenticated, or belongs
 * to a different agency, it can read data it must never see.
 *
 * <p>That is not a hypothetical bug — it is the single most likely way this
 * system leaks data across tenants. Therefore:
 *
 * <ul>
 *   <li>{@link #clear()} is called from a {@code finally} block in
 *       {@code TenantFilter}, so it runs even when the request throws.</li>
 *   <li>Nothing else calls {@link #set} — the value comes from the verified JWT
 *       and from nowhere else. Never from a header, query parameter or body.</li>
 * </ul>
 *
 * <p>Both values are deliberately {@link Optional}: a user who has just
 * registered has no organization yet, and unauthenticated requests have
 * neither.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_ORGANIZATION = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_USER = new ThreadLocal<>();

    private TenantContext() {
    }

    /**
     * @param organizationId active organization, or {@code null} when the user
     *                       has no membership yet
     * @param userId         authenticated user
     */
    public static void set(UUID organizationId, UUID userId) {
        CURRENT_ORGANIZATION.set(organizationId);
        CURRENT_USER.set(userId);
    }

    public static Optional<UUID> getOrganizationId() {
        return Optional.ofNullable(CURRENT_ORGANIZATION.get());
    }

    public static Optional<UUID> getUserId() {
        return Optional.ofNullable(CURRENT_USER.get());
    }

    /**
     * The active organization, or fail.
     *
     * <p>Use this in code that genuinely cannot proceed without a tenant. It
     * throws rather than returning null so a missing tenant surfaces as a loud
     * 500 instead of a query that quietly runs unfiltered.
     */
    public static UUID requireOrganizationId() {
        UUID id = CURRENT_ORGANIZATION.get();
        if (id == null) {
            throw new IllegalStateException(
                    "No active organization on this thread. Either the endpoint requires a "
                            + "workspace and the caller has none, or TenantFilter did not run.");
        }
        return id;
    }

    /** Must run in a {@code finally} block for every request. */
    public static void clear() {
        CURRENT_ORGANIZATION.remove();
        CURRENT_USER.remove();
    }
}
