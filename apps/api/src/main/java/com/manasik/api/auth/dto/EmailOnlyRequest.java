package com.manasik.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Shared by resend-verification and forgot-password. */
public record EmailOnlyRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email
) {
}
