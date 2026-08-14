package com.manasik.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class ApiApplication {

    private static final Logger log = LoggerFactory.getLogger(ApiApplication.class);

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(ApiApplication.class, args);

        Environment env = context.getEnvironment();
        String port = env.getProperty("server.port", "4000");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        String profiles = String.join(", ", env.getActiveProfiles());

        log.info("""

                        ────────────────────────────────────────────────
                          Manasik API is up
                          Profile   : {}
                          API       : http://localhost:{}{}
                          Health    : http://localhost:{}{}/actuator/health
                          Swagger   : http://localhost:{}{}/swagger-ui.html
                        ────────────────────────────────────────────────""",
                profiles.isEmpty() ? "default" : profiles,
                port, contextPath,
                port, contextPath,
                port, contextPath);
    }
}
