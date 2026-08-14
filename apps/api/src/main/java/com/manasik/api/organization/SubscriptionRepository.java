package com.manasik.api.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Tenant-scoped. {@code Subscription} carries {@code @TenantId}, so Hibernate
 * appends {@code organization_id = <active tenant>} to every query here
 * automatically — including {@code findAll()}.
 *
 * <p>That is why there is no {@code findByOrganizationId}: the tenant is
 * implicit, and accepting one as a parameter would invite callers to pass an
 * organization the current user has no membership in.
 */
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    /**
     * The active tenant's subscription. Returns empty rather than another
     * organization's row, because the tenant filter is applied by Hibernate
     * before this query ever reaches the database.
     */
    default Optional<Subscription> findForCurrentTenant() {
        return findAll().stream().findFirst();
    }
}
