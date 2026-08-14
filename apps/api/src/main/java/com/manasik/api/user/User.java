package com.manasik.api.user;

import com.manasik.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A person. <strong>Not</strong> a tenant.
 *
 * <p>Deliberately has no {@code organizationId} (ROADMAP D5). A user reaches
 * organizations through {@code Membership}, which is what allows one person to
 * belong to several agencies — and what allows a freshly registered person to
 * belong to none.
 *
 * <p>Correspondingly this table is exempt from RLS: someone with zero
 * memberships still has to be able to log in.
 */
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /**
     * Globally unique, case-insensitively — enforced by
     * {@code ux_users_email_lower}, a unique index on {@code LOWER(email)}.
     * Always write this lowercased; the index is the safety net, not the rule.
     */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    /**
     * BCrypt hash, cost 12. Never expose this on a DTO — the safe projection
     * lives in the API response types, not here.
     */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "locale", nullable = false, length = 10)
    private String locale = "en";

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
