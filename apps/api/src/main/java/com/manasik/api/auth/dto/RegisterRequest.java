package com.manasik.api.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registration creates a <strong>person</strong>, not an agency (ROADMAP D5).
 * The workspace is a separate step, which is what allows one user to later
 * belong to several agencies.
 *
 * <p>These rules mirror {@code registerSchema} in {@code @manasik/validations}.
 * The frontend copy exists for immediate feedback; this one is the enforcement.
 * If they drift, this wins — and the user gets a confusing error, so keep them
 * in step.
 */
public record RegisterRequest(

        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 255, message = "Email must be at most 255 characters")
        String email,

        // Composed of single-character lookaheads so each failing rule can have
        // its own message. One combined regex would produce a single unhelpful
        // "password is invalid" for every kind of mistake.
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        @Pattern(regexp = ".*[A-Z].*", message = "Password must contain at least one uppercase letter")
        @Pattern(regexp = ".*[a-z].*", message = "Password must contain at least one lowercase letter")
        @Pattern(regexp = ".*[0-9].*", message = "Password must contain at least one number")
        @Pattern(regexp = ".*[^A-Za-z0-9].*", message = "Password must contain at least one special character")
        String password,

        @AssertTrue(message = "You must accept the Terms & Privacy Policy")
        boolean acceptTerms
) {
}
