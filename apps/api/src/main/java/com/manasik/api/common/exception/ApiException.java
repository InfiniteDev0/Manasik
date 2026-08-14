package com.manasik.api.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base for exceptions whose message is safe to return to a client.
 *
 * <p>Anything that does <em>not</em> extend this is treated as unexpected by
 * {@code GlobalExceptionHandler}: it is logged with a stack trace and the
 * client gets a generic 500. That split is deliberate — it means an accidental
 * {@code NullPointerException} or a database error can never leak internals.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
