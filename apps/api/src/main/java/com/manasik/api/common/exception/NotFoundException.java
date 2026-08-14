package com.manasik.api.common.exception;

import org.springframework.http.HttpStatus;

/** 404 — the resource does not exist, or the caller's tenant cannot see it. */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }

    /**
     * Prefer this over exposing the id in a message you compose by hand.
     *
     * <p>Note: when a record exists but belongs to another organization, return
     * 404 and not 403. A 403 confirms the id is real, which lets one agency
     * probe another's data.
     */
    public static NotFoundException of(String resource) {
        return new NotFoundException(resource + " not found");
    }
}
