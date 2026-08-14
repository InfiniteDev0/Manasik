package com.manasik.api;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base for tests that need a real PostgreSQL.
 *
 * <p>The container is {@code static} and never stopped: Testcontainers' Ryuk
 * sidecar removes it when the JVM exits, so one container is shared by every
 * test class in the run rather than paying ~5s of startup per class.
 *
 * <p>Two identities are configured, mirroring production exactly:
 * <ul>
 *   <li><b>Flyway</b> — the container superuser. Owns the tables, runs DDL.</li>
 *   <li><b>The application</b> — {@code manasik_app}, created by the init
 *       script with {@code NOBYPASSRLS}, so RLS genuinely applies.</li>
 * </ul>
 *
 * Collapsing these into one superuser connection would make every isolation
 * assertion meaningless.
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    protected static final String APP_USERNAME = "manasik_app";
    protected static final String APP_PASSWORD = "test_app_password";

    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:17-alpine"))
                    .withDatabaseName("manasik_test")
                    .withInitScript("db/testcontainer-init.sql")
                    // Reused across classes; see the class comment.
                    .withReuse(false);

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        // Runtime connection — the restricted role.
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", () -> APP_USERNAME);
        registry.add("spring.datasource.password", () -> APP_PASSWORD);

        // Migrations — the owner.
        registry.add("spring.flyway.url", POSTGRES::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRES::getUsername);
        registry.add("spring.flyway.password", POSTGRES::getPassword);
    }
}
