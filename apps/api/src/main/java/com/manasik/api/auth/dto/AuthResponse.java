package com.manasik.api.auth.dto;

import com.manasik.api.organization.Role;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * What login and verify-email return.
 *
 * <p>The refresh token is <strong>absent by design</strong> — it goes out as an
 * HttpOnly cookie so JavaScript cannot read it, which is what limits the damage
 * from an XSS bug to the 15-minute access token rather than a 30-day session.
 *
 * <p>{@code memberships} drives the decision immediately after login: empty
 * means send the user to create a workspace, otherwise open the active one.
 * Returning it here saves a second round-trip on every sign-in.
 */
public record AuthResponse(
        String accessToken,
        UserResponse user,
        List<MembershipSummary> memberships,
        UUID activeOrganizationId
) {

    /** Safe user projection. {@code passwordHash} must never appear here. */
    public record UserResponse(
            UUID id,
            String fullName,
            String email,
            boolean emailVerified,
            String avatarUrl,
            String locale,
            Instant lastLoginAt,
            Instant createdAt
    ) {
    }

    /** One workspace in the switcher, with the organization inlined. */
    public record MembershipSummary(
            UUID organizationId,
            String organizationName,
            String organizationSlug,
            String logoUrl,
            Role role
    ) {
    }
}
