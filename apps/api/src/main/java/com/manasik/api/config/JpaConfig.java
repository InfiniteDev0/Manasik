package com.manasik.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Turns on {@code @CreatedDate} / {@code @LastModifiedDate} population for
 * {@link com.manasik.api.common.BaseEntity}.
 *
 * <p>{@code @CreatedBy} is not wired yet — it needs an {@code AuditorAware}
 * backed by the authenticated principal, which arrives with auth in Phase 4.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
