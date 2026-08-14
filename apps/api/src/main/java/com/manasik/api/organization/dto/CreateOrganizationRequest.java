package com.manasik.api.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 1 of onboarding — "Let's set up your agency".
 *
 * <p>Deliberately the bare minimum. Agency type, pilgrim volume and team
 * invitations are later steps and all skippable; demanding them here would put
 * a wall between a verified user and a usable product.
 *
 * <p>Mirrors {@code createOrganizationSchema} in {@code @manasik/validations}.
 */
public record CreateOrganizationRequest(

        @NotBlank(message = "Agency name is required")
        @Size(min = 2, max = 150, message = "Agency name must be between 2 and 150 characters")
        String name,

        // ISO 3166-1 alpha-2, e.g. KE. Uppercased server-side.
        @NotBlank(message = "Country is required")
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "Country must be a 2-letter country code")
        String country,

        // ISO 4217, e.g. KES.
        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a 3-letter currency code")
        String currency,

        // IANA zone, e.g. Africa/Nairobi.
        @NotBlank(message = "Timezone is required")
        @Size(max = 64, message = "Timezone must be at most 64 characters")
        String timezone
) {
}
