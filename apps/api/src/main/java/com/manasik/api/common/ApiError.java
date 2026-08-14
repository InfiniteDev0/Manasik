package com.manasik.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Error body for every failed request.
 *
 * <p>{@code fieldErrors} carries per-field validation messages so the frontend
 * can attach them to the right input instead of showing one generic banner.
 * It is omitted entirely when there are none.
 *
 * @param status     HTTP status code, repeated in the body for convenience
 * @param error      short machine-ish label, e.g. "Bad Request"
 * @param message    human-readable summary, safe to show a user
 * @param path       request URI that failed
 * @param fieldErrors field name to message, for validation failures only
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors,
        Instant timestamp
) {
    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(status, error, message, path, null, Instant.now());
    }

    public static ApiError validation(String message, String path, Map<String, String> fieldErrors) {
        return new ApiError(400, "Bad Request", message, path, fieldErrors, Instant.now());
    }
}
