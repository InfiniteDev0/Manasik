package com.manasik.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Code must be exactly 6 digits")
        String code
) {
}
