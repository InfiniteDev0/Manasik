package com.manasik.api.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * One live refresh token. Replaces Redis as the JTI store.
 *
 * <h2>Rotation and reuse detection</h2>
 *
 * A refresh token is valid only while its {@code jti} has a row here.
 *
 * <ul>
 *   <li><b>Rotation</b> — every successful refresh deletes this row and writes
 *       a new one. A refresh token is therefore single-use.</li>
 *   <li><b>Reuse detection</b> — presenting a {@code jti} with no row means the
 *       token was already rotated. Either it was replayed, or it leaked and
 *       someone else used it first. Both are hostile, and neither is
 *       distinguishable, so the response is to delete <em>every</em> session
 *       for that user and force a fresh login.</li>
 * </ul>
 *
 * That last behaviour is the entire reason for storing sessions at all. A
 * stateless refresh token cannot be revoked, so a stolen one works until it
 * expires — thirty days of silent access.
 */
@Entity
@Table(name = "refresh_sessions")
public class RefreshSession {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** The {@code jti} claim of the refresh token. Unique across all sessions. */
    @Column(name = "jti", nullable = false, unique = true, updatable = false)
    private UUID jti;

    /**
     * Workspace active when this session was issued. Nullable — a user with no
     * membership still gets a session, which is how they reach the
     * create-workspace flow at all.
     */
    @Column(name = "organization_id")
    private UUID organizationId;

    /** Recorded so a user can recognise their own sessions in settings later. */
    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getJti() {
        return jti;
    }

    public void setJti(UUID jti) {
        this.jti = jti;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
