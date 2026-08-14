package com.manasik.api.auth.jwt;

/**
 * Distinguishes the two token kinds.
 *
 * <p>Stamped into a {@code typ} claim and checked on verification. The two
 * tokens are already signed with different secrets, so one cannot verify as
 * the other — this claim is a second, explicit assertion so that a future
 * refactor which accidentally shares a key still cannot let an access token be
 * spent as a refresh token.
 */
public enum TokenType {
    ACCESS,
    REFRESH
}
