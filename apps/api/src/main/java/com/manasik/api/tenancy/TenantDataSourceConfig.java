package com.manasik.api.tenancy;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Wraps the application's {@link DataSource} in {@link TenantAwareDataSource}.
 *
 * <p>Done with a {@link BeanPostProcessor} rather than by declaring our own
 * {@code DataSource} bean, so Boot keeps full control of Hikari configuration
 * (pool sizing, timeouts, metrics) and we only decorate the result.
 *
 * <p>Only the bean literally named {@code dataSource} is wrapped. Flyway runs
 * on its own connection as {@code postgres} — the owning role, which needs to
 * see every row to migrate — and must not be tenant-filtered.
 */
@Configuration
public class TenantDataSourceConfig implements BeanPostProcessor {

    private static final String APPLICATION_DATASOURCE_BEAN = "dataSource";

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof DataSource dataSource
                && APPLICATION_DATASOURCE_BEAN.equals(beanName)
                && !(bean instanceof TenantAwareDataSource)) {
            return new TenantAwareDataSource(dataSource);
        }
        return bean;
    }
}
