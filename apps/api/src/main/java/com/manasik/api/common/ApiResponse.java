package com.manasik.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Envelope for every successful response.
 *
 * <p>The frontend's {@code lib/api.ts} unwraps {@code json.data}, so the shape
 * here is not cosmetic — changing it breaks every fetch in the web app.
 *
 * <p>Errors do <strong>not</strong> use this type; they use {@link ApiError},
 * produced by {@code GlobalExceptionHandler}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(T data, String message, Instant timestamp) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, null, Instant.now());
    }

    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(data, message, Instant.now());
    }

    /** For endpoints that only report an outcome (logout, resend email, ...). */
    public static ApiResponse<Void> message(String message) {
        return new ApiResponse<>(null, message, Instant.now());
    }
}
