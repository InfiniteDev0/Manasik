package com.manasik.api.auth.dto;

import java.util.UUID;

/**
 * Internal only — never serialized to a client.
 *
 * <p>Carries the refresh token from the service to the controller, which puts
 * it in an HttpOnly cookie. Keeping this out of {@link AuthResponse} means the
 * refresh token cannot end up in a JSON body by accident.
 *
 * @param jti shared by both tokens, linking an access token to the refresh
 *            session that authorised it
 */
public record TokenPair(String accessToken, String refreshToken, UUID jti) {
}
