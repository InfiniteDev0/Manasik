package com.manasik.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Smoke test: the Spring context starts.
 *
 * <p>Cheap but genuinely useful — it catches a missing bean, a bad
 * {@code application.yml} key, or a circular dependency at build time instead
 * of at deploy time.
 */
@SpringBootTest
class ApiApplicationTests {

    @Test
    void contextLoads() {
        // Fails if the application context cannot be built.
    }
}
