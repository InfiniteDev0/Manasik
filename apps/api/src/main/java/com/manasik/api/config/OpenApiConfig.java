package com.manasik.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI document definition.
 *
 * <p>This is not only for humans: ROADMAP D4 has the frontend generate its
 * TypeScript types from the spec this produces ({@code pnpm gen:api-types}).
 * A DTO renamed here becomes a compile error in the web app rather than a
 * runtime surprise, so the annotations on controllers earn their keep.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI manasikOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Manasik API")
                        .description("The operating system for Hajj & Umrah agencies.")
                        .version("v1")
                        .contact(new Contact().name("Manasik")))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("""
                                        Access token from POST /auth/login. Short-lived (15 min).
                                        The refresh token is an HttpOnly cookie and is deliberately
                                        never exposed to JavaScript or documented as a parameter.""")))
                // Applied globally so Swagger's "Authorize" button covers every
                // endpoint. Public routes override this with @SecurityRequirements.
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
