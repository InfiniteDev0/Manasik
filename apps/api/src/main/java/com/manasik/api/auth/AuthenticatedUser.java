package com.manasik.api.auth;

import com.manasik.api.organization.Role;
import com.manasik.api.tenancy.TenantPrincipal;

import java.util.UUID;

/**
 * The authenticated caller, reconstructed from a verified access token.
 *
 * <p>Implements {@link TenantPrincipal} so {@code TenantFilter} can read the
 * active organization without the tenancy package depending on auth.
 *
 * @param userId         subject of the token
 * @param organizationId active organization, or {@code null} for a user with no
 *                       membership yet (just registered, no workspace)
 * @param role           role within that organization, {@code null} alongside a
 *                       null organization
 */
public record AuthenticatedUser(UUID userId, UUID organizationId, Role role)
        implements TenantPrincipal {

    @Override
    public UUID getUserId() {
        return userId;
    }

    @Override
    public UUID getOrganizationId() {
        return organizationId;
    }

    /** True once the user has an active workspace selected. */
    public boolean hasOrganization() {
        return organizationId != null;
    }
}
