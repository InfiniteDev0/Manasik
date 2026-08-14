package com.manasik.api.common;

import com.manasik.api.common.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns exceptions into {@link ApiError} bodies.
 *
 * <p>The governing rule: <strong>never let an unexpected exception's message
 * reach the client.</strong> Only {@link ApiException} subclasses are trusted
 * to carry user-facing text. Everything else is logged in full and answered
 * with a generic 500, so a stray SQL or NPE message can't leak schema details.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Our own exceptions — message is intentional and safe to expose. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        return ResponseEntity.status(status).body(
                ApiError.of(status.value(), status.getReasonPhrase(), ex.getMessage(), request.getRequestURI())
        );
    }

    /** Jakarta Validation failures on an {@code @Valid} request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        // LinkedHashMap so field order matches declaration order, which makes
        // the frontend's "focus the first invalid field" behaviour predictable.
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            // Keep the FIRST message per field; later ones are usually noise
            // from a second constraint on the same property.
            fieldErrors.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage()
            );
        }

        return ResponseEntity.badRequest().body(
                ApiError.validation("Validation failed", request.getRequestURI(), fieldErrors)
        );
    }

    /**
     * Bad credentials.
     *
     * <p>The message is passed through because every {@code BadCredentialsException}
     * we raise carries a deliberately non-committal one ("Invalid email or
     * password"), identical whether the account exists or the password was
     * wrong. Surfacing it gives the user something actionable without telling
     * an attacker which half failed.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        log.debug("Bad credentials for {}", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(401, "Unauthorized", ex.getMessage(), request.getRequestURI())
        );
    }

    /**
     * Any other authentication failure. Kept vague — the message could come
     * from Spring internals, and those are not written with disclosure in mind.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        log.debug("Authentication failed for {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiError.of(401, "Unauthorized", "Authentication required", request.getRequestURI())
        );
    }

    /** Authenticated, but lacking the permission for this action. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        log.debug("Access denied for {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiError.of(403, "Forbidden", "You do not have permission to perform this action",
                        request.getRequestURI())
        );
    }

    /**
     * Anything unanticipated. Full stack trace to the log, generic message to
     * the caller. Do not be tempted to include {@code ex.getMessage()} here.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiError.of(500, "Internal Server Error", "Something went wrong. Please try again.",
                        request.getRequestURI())
        );
    }
}
