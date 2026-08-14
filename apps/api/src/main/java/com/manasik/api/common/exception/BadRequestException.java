package com.manasik.api.common.exception;

import org.springframework.http.HttpStatus;

/** 400 — semantically invalid request that Jakarta Validation can't express. */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
