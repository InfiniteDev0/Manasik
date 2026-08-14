package com.manasik.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Note the absence of password complexity rules here.
 *
 * <p>Applying them to login would leak policy: an attacker could learn which
 * passwords are even possible, and a user whose password predates a rule change
 * would be locked out by validation before authentication was ever attempted.
 * Login only cares whether the submitted value matches.
 */
public record LoginRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
}
