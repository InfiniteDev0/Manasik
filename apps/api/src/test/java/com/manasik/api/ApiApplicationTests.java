package com.manasik.api;

import org.junit.jupiter.api.Test;

/**
 * Smoke test: the Spring context starts.
 *
 * <p>Extends {@link AbstractIntegrationTest} because JPA is now on the
 * classpath — without a real database the context cannot build a
 * {@code SessionFactory}, and this would fail for reasons unrelated to the
 * application.
 *
 * <p>Cheap, but it genuinely catches a missing bean, a bad {@code
 * application.yml} key, a broken migration, or an entity that no longer matches
 * the schema — all at build time rather than deploy time.
 */
class ApiApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // Fails if the application context cannot be built.
    }
}
