package com.manasik.api.organization;

import com.manasik.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * An agency's workspace — the tenant.
 *
 * <p>This entity is <em>not</em> tenant-filtered itself. The workspace switcher
 * must list every organization a user belongs to, which is inherently a
 * cross-tenant read; filtering to the active one would show a user only the
 * workspace they are already in.
 *
 * <p>Enums are persisted as strings and mirrored by {@code CHECK} constraints
 * in {@code V1__initial_schema.sql}. {@code EnumType.ORDINAL} is never used —
 * reordering the enum would silently reinterpret every existing row.
 */
@Entity
@Table(name = "organizations")
public class Organization extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "slug", nullable = false, length = 150)
    private String slug;

    @Column(name = "logo_url")
    private String logoUrl;

    /** ISO 3166-1 alpha-2, e.g. {@code KE}. */
    @Column(name = "country", nullable = false, length = 2, columnDefinition = "bpchar")
    private String country;

    /** ISO 4217, e.g. {@code KES}. */
    @Column(name = "currency", nullable = false, length = 3, columnDefinition = "bpchar")
    private String currency;

    /** IANA zone, e.g. {@code Africa/Nairobi}. */
    @Column(name = "timezone", nullable = false, length = 64)
    private String timezone;

    @Enumerated(EnumType.STRING)
    @Column(name = "organization_type", length = 20)
    private OrganizationType organizationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "pilgrims_per_year", length = 20)
    private PilgrimVolume pilgrimsPerYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    /**
     * Display copy of the subscription's plan.
     *
     * <p>Duplicated here because {@code subscriptions} is RLS-scoped to the
     * active organization, so it cannot be read for the other workspaces in the
     * switcher, nor at login before a tenant is set. See the V5 migration.
     *
     * <p>Whatever changes a subscription's plan must update this in the same
     * transaction.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false, length = 20)
    private SubscriptionPlan plan = SubscriptionPlan.TRIAL;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public OrganizationType getOrganizationType() {
        return organizationType;
    }

    public void setOrganizationType(OrganizationType organizationType) {
        this.organizationType = organizationType;
    }

    public PilgrimVolume getPilgrimsPerYear() {
        return pilgrimsPerYear;
    }

    public void setPilgrimsPerYear(PilgrimVolume pilgrimsPerYear) {
        this.pilgrimsPerYear = pilgrimsPerYear;
    }

    public OrganizationStatus getStatus() {
        return status;
    }

    public void setStatus(OrganizationStatus status) {
        this.status = status;
    }

    public SubscriptionPlan getPlan() {
        return plan;
    }

    public void setPlan(SubscriptionPlan plan) {
        this.plan = plan;
    }
}
