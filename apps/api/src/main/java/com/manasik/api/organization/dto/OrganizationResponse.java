package com.manasik.api.organization.dto;

import com.manasik.api.organization.Organization;
import com.manasik.api.organization.OrganizationStatus;
import com.manasik.api.organization.OrganizationType;
import com.manasik.api.organization.PilgrimVolume;
import com.manasik.api.organization.Role;
import com.manasik.api.organization.SubscriptionPlan;

import java.time.Instant;
import java.util.UUID;

/**
 * A workspace as the client sees it.
 *
 * <p>{@code role} is the <em>caller's</em> role here, not a property of the
 * organization — it saves the frontend correlating a separate membership list
 * just to decide which buttons to render.
 *
 * <p>{@code accessToken} is present only on creation and workspace switching,
 * where the token is reissued to carry the new active organization. It is null
 * on plain reads.
 */
public record OrganizationResponse(
        UUID id,
        String name,
        String slug,
        String logoUrl,
        String country,
        String currency,
        String timezone,
        OrganizationType organizationType,
        PilgrimVolume pilgrimsPerYear,
        OrganizationStatus status,
        SubscriptionPlan plan,
        Role role,
        String accessToken,
        Instant createdAt
) {

    public static OrganizationResponse of(Organization organization, Role role, String accessToken) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getLogoUrl(),
                organization.getCountry(),
                organization.getCurrency(),
                organization.getTimezone(),
                organization.getOrganizationType(),
                organization.getPilgrimsPerYear(),
                organization.getStatus(),
                organization.getPlan(),
                role,
                accessToken,
                organization.getCreatedAt());
    }
}
