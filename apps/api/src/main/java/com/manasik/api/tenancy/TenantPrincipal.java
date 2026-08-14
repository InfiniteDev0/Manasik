package com.manasik.api.tenancy;

import java.util.UUID;

/**
 * Implemented by the authenticated principal so {@link TenantFilter} can read
 * the tenant without depending on the auth package.
 *
 * <p>Phase 4's JWT principal implements this. The values must come from the
 * <strong>verified token</strong> and nowhere else — never a header, query
 * parameter, or request body, all of which the caller controls.
 */
public interface TenantPrincipal {

    UUID getUserId();

    /** Active organization, or {@code null} when the user has no membership yet. */
    UUID getOrganizationId();
}
