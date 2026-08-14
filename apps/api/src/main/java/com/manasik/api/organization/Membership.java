package com.manasik.api.organization;

import com.manasik.api.common.BaseEntity;
import com.manasik.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Joins a {@link User} to an {@link Organization}, carrying their role there.
 *
 * <p>This is the table that makes multi-workspace possible (ROADMAP D5), and it
 * is the reason {@code User} has no organization column.
 *
 * <h2>Why there is no {@code @TenantId} here</h2>
 *
 * Tenant-filtering this entity would break the product. "Which organizations
 * does this person belong to?" — the workspace switcher, and the decision after
 * login about where to send them — is inherently a cross-tenant question. If
 * Hibernate scoped it to the active organization, a user could only ever
 * discover the workspace they were already in.
 *
 * <p>Access control for memberships therefore lives in the service layer:
 * always filter by the authenticated {@code userId}.
 */
@Entity
@Table(
        name = "memberships",
        uniqueConstraints = @UniqueConstraint(
                name = "ux_memberships_user_org",
                columnNames = {"user_id", "organization_id"}
        )
)
public class Membership extends BaseEntity {

    /**
     * LAZY on purpose. The default for {@code @ManyToOne} is EAGER, which would
     * fetch the full user and organization on every membership load — and turn
     * "list my workspaces" into a pile of joins nobody asked for.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MembershipStatus status = MembershipStatus.ACTIVE;

    @Column(name = "invited_at")
    private Instant invitedAt;

    @Column(name = "joined_at")
    private Instant joinedAt;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public MembershipStatus getStatus() {
        return status;
    }

    public void setStatus(MembershipStatus status) {
        this.status = status;
    }

    public Instant getInvitedAt() {
        return invitedAt;
    }

    public void setInvitedAt(Instant invitedAt) {
        this.invitedAt = invitedAt;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    /** Only an ACTIVE membership grants access; INVITED and SUSPENDED do not. */
    public boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }
}
