package com.manasik.api.common.exception;

import org.springframework.http.HttpStatus;

/** 409 — the request clashes with existing state (duplicate email, etc.). */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
