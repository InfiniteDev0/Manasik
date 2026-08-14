package com.manasik.api.auth.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * JWT configuration, bound from {@code manasik.jwt.*}.
 *
 * <p>The two secrets must be independent. Signing both token types with the
 * same key would let a 15-minute access token be presented as a 30-day refresh
 * token — an enormous privilege escalation from a single reused string.
 *
 * @param accessSecret  base64, at least 32 bytes decoded (HS256 minimum)
 * @param refreshSecret base64, independent of {@code accessSecret}
 * @param accessTtl     short by design; the refresh token covers longevity
 * @param refreshTtl     how long a session survives without re-login
 */
@ConfigurationProperties(prefix = "manasik.jwt")
public record JwtProperties(
        String accessSecret,
        String refreshSecret,
        @DefaultValue("15m") Duration accessTtl,
        @DefaultValue("30d") Duration refreshTtl,
        @DefaultValue("manasik") String issuer
) {
}
