package com.manasik.api.auth.jwt;

import com.manasik.api.organization.Role;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/**
 * Issues and verifies the two token types.
 *
 * <p>Access and refresh tokens are signed with <strong>separate keys</strong>,
 * so a token of one kind simply cannot verify as the other. The {@code typ}
 * claim is checked on top of that as a belt-and-braces assertion.
 *
 * <p>Claims carried on the access token:
 * <ul>
 *   <li>{@code sub} — user id</li>
 *   <li>{@code org} — <b>active</b> organization, or absent when the user has
 *       no membership yet. This is what drives tenant isolation, and it comes
 *       from the server at issue time, never from the client.</li>
 *   <li>{@code role} — role within that organization</li>
 *   <li>{@code jti} — ties the access token to its refresh session</li>
 * </ul>
 */
@Service
public class JwtService {

    public static final String CLAIM_ORGANIZATION = "org";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_TOKEN_TYPE = "typ";

    private static final MacAlgorithm ALGORITHM = MacAlgorithm.HS256;

    private final JwtProperties properties;
    private final JwtEncoder accessEncoder;
    private final JwtDecoder accessDecoder;
    private final JwtEncoder refreshEncoder;
    private final JwtDecoder refreshDecoder;

    public JwtService(JwtProperties properties) {
        this.properties = properties;

        SecretKey accessKey = toKey(properties.accessSecret(), "manasik.jwt.access-secret");
        SecretKey refreshKey = toKey(properties.refreshSecret(), "manasik.jwt.refresh-secret");

        if (accessKey.equals(refreshKey)) {
            // Would let a 15-minute access token be spent as a 30-day refresh
            // token. Refuse to start rather than run with it.
            throw new IllegalStateException(
                    "JWT access and refresh secrets are identical. They must be independent values.");
        }

        this.accessEncoder = new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(accessKey));
        this.accessDecoder = NimbusJwtDecoder.withSecretKey(accessKey).macAlgorithm(ALGORITHM).build();
        this.refreshEncoder = new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(refreshKey));
        this.refreshDecoder = NimbusJwtDecoder.withSecretKey(refreshKey).macAlgorithm(ALGORITHM).build();
    }

    /**
     * @param organizationId active organization, or {@code null} for a user who
     *                       has not created or joined a workspace yet
     * @param jti            shared with the refresh session, so revoking the
     *                       session can be correlated with its access tokens
     */
    public String issueAccessToken(UUID userId, UUID organizationId, Role role, UUID jti) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(userId.toString())
                .id(jti.toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.accessTtl()))
                .claim(CLAIM_TOKEN_TYPE, TokenType.ACCESS.name());

        // Omitted entirely rather than set to null — a claim that is absent is
        // unambiguous, whereas a null-valued one invites "did it fail to set?"
        if (organizationId != null) {
            claims.claim(CLAIM_ORGANIZATION, organizationId.toString());
        }
        if (role != null) {
            claims.claim(CLAIM_ROLE, role.name());
        }

        return encode(accessEncoder, claims.build());
    }

    public String issueRefreshToken(UUID userId, UUID organizationId, UUID jti) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .subject(userId.toString())
                .id(jti.toString())
                .issuedAt(now)
                .expiresAt(now.plus(properties.refreshTtl()))
                .claim(CLAIM_TOKEN_TYPE, TokenType.REFRESH.name());

        if (organizationId != null) {
            claims.claim(CLAIM_ORGANIZATION, organizationId.toString());
        }

        return encode(refreshEncoder, claims.build());
    }

    /**
     * Verifies signature, expiry and token type.
     *
     * @throws JwtException if the token is invalid, expired, or of the wrong type
     */
    public Jwt verify(String token, TokenType expected) {
        JwtDecoder decoder = expected == TokenType.ACCESS ? accessDecoder : refreshDecoder;
        Jwt jwt = decoder.decode(token);

        String actual = jwt.getClaimAsString(CLAIM_TOKEN_TYPE);
        if (!expected.name().equals(actual)) {
            throw new JwtException(
                    "Expected a %s token but received %s".formatted(expected, actual));
        }
        return jwt;
    }

    public Duration accessTtl() {
        return properties.accessTtl();
    }

    public Duration refreshTtl() {
        return properties.refreshTtl();
    }

    private static String encode(JwtEncoder encoder, JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(ALGORITHM).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /**
     * Decodes a base64 secret and rejects anything too short.
     *
     * <p>HS256 requires at least 256 bits of key material. A shorter key does
     * not fail loudly at signing time — it just produces weak signatures — so
     * the check happens here, at startup, where it is impossible to miss.
     */
    private static SecretKey toKey(String base64Secret, String propertyName) {
        if (base64Secret == null || base64Secret.isBlank()) {
            throw new IllegalStateException(propertyName + " is not set");
        }

        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(base64Secret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(propertyName + " must be valid base64", e);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "%s must decode to at least 32 bytes for HS256 (got %d)"
                            .formatted(propertyName, keyBytes.length));
        }
        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }
}
