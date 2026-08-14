package com.manasik.api.tenancy;

import org.hibernate.cfg.MultiTenancySettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
// Boot 4 reorganized autoconfigure packages: `org.springframework.boot.autoconfigure.orm.jpa`
// became `org.springframework.boot.hibernate.autoconfigure`, in the new
// spring-boot-hibernate module. Boot 3 imports will not resolve.
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Tells Hibernate which tenant the current thread is operating as.
 *
 * <p>With discriminator multi-tenancy, Hibernate uses this to:
 * <ul>
 *   <li>stamp {@code organization_id} automatically on every insert, and</li>
 *   <li>append {@code organization_id = ?} to every read</li>
 * </ul>
 * for entities carrying a {@code @TenantId} field. That removes the need to
 * remember a filter on each query — the class of bug that leaks tenant data.
 *
 * <p>It is a convenience, not the guarantee. Native queries bypass it entirely,
 * which is exactly why Postgres RLS exists underneath (see V2 migration).
 */
@Component
public class TenantIdentifierResolver
        implements CurrentTenantIdentifierResolver<UUID>, HibernatePropertiesCustomizer {

    /**
     * Sentinel used when there is no tenant — an unauthenticated request, or a
     * user who has not created a workspace yet.
     *
     * <p>Hibernate does not accept null here. An all-zero UUID is used because
     * it can never match a real {@code gen_random_uuid()} value, so any query
     * that reaches the database with this tenant returns nothing. Failing to
     * empty results is the correct direction to fail.
     */
    static final UUID NO_TENANT = new UUID(0L, 0L);

    @Override
    public UUID resolveCurrentTenantIdentifier() {
        return TenantContext.getOrganizationId().orElse(NO_TENANT);
    }

    /**
     * {@code false} because the tenant changes between requests on a reused
     * thread. Returning {@code true} would let Hibernate keep cached session
     * state across tenants — a cross-agency leak by way of the second-level
     * cache.
     */
    @Override
    public boolean validateExistingCurrentSessions() {
        return false;
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(MultiTenancySettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this);
    }
}
