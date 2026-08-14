package com.manasik.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Code must be exactly 6 digits")
        String code,

        // Same rules as registration: a reset must not be a route around the
        // password policy.
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        @Pattern(regexp = ".*[A-Z].*", message = "Password must contain at least one uppercase letter")
        @Pattern(regexp = ".*[a-z].*", message = "Password must contain at least one lowercase letter")
        @Pattern(regexp = ".*[0-9].*", message = "Password must contain at least one number")
        @Pattern(regexp = ".*[^A-Za-z0-9].*", message = "Password must contain at least one special character")
        String password
) {
}
