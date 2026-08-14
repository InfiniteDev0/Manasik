package com.manasik.api.organization;

import com.manasik.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.TenantId;

import java.time.Instant;
import java.util.UUID;

/**
 * An organization's plan. <strong>Tenant-scoped.</strong>
 *
 * <p>This is the first entity carrying {@link TenantId}, and it is the pattern
 * every business entity (pilgrims, bookings, packages, payments…) will follow.
 *
 * <h2>What {@code @TenantId} buys</h2>
 *
 * Hibernate populates {@code organizationId} from the current tenant on insert,
 * and appends {@code organization_id = ?} to every read — without any query
 * needing to remember. Forgetting a filter is the single most common way
 * multi-tenant systems leak, and this removes the opportunity.
 *
 * <p>It is a convenience, not the guarantee. Native SQL bypasses it entirely,
 * which is why Postgres RLS sits underneath as an independent backstop
 * ({@code V2__row_level_security.sql}).
 *
 * <p>Note the field is a raw {@link UUID} rather than a {@code @ManyToOne} to
 * {@link Organization}: Hibernate manages this column itself, and an
 * association would let application code assign a different organization than
 * the active tenant — precisely what this is meant to prevent.
 */
@Entity
@Table(name = "subscriptions")
public class Subscription extends BaseEntity {

    @TenantId
    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false, length = 20)
    private SubscriptionPlan plan = SubscriptionPlan.TRIAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "trial_ends_at")
    private Instant trialEndsAt;

    @Column(name = "current_period_ends_at")
    private Instant currentPeriodEndsAt;

    public UUID getOrganizationId() {
        return organizationId;
    }

    public SubscriptionPlan getPlan() {
        return plan;
    }

    public void setPlan(SubscriptionPlan plan) {
        this.plan = plan;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public Instant getTrialEndsAt() {
        return trialEndsAt;
    }

    public void setTrialEndsAt(Instant trialEndsAt) {
        this.trialEndsAt = trialEndsAt;
    }

    public Instant getCurrentPeriodEndsAt() {
        return currentPeriodEndsAt;
    }

    public void setCurrentPeriodEndsAt(Instant currentPeriodEndsAt) {
        this.currentPeriodEndsAt = currentPeriodEndsAt;
    }
}
