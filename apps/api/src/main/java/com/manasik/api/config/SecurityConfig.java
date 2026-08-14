package com.manasik.api.config;

import com.manasik.api.auth.JwtAuthenticationFilter;
import com.manasik.api.auth.jwt.JwtService;
import com.manasik.api.common.ratelimit.RateLimitFilter;
import com.manasik.api.common.ratelimit.RateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Base security configuration.
 *
 * <p>PHASE 2 SCOPE: there are no authenticated endpoints yet, so this only sets
 * the posture — stateless, CORS locked to the web origin, and <em>deny by
 * default</em>. The JWT filter, login endpoints and method-level authorization
 * arrive in Phase 4.
 *
 * <p>Deny-by-default matters: every route added from here on is closed unless
 * someone opts it out explicitly. The opposite default is how endpoints
 * accidentally ship public.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Paths reachable without authentication.
     *
     * <p>These are matched <strong>after</strong> the {@code /v1} context path
     * is stripped, so they are written without it.
     */
    private static final String[] PUBLIC_PATHS = {
            "/actuator/health",
            "/actuator/health/**",
            "/actuator/info",
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/api-docs",
            "/api-docs/**",
    };

    /**
     * Auth endpoints reachable without a token — by definition, since these are
     * how a caller obtains one.
     *
     * <p>Everything NOT listed here stays authenticated, including
     * {@code /auth/me} and {@code /auth/logout}. Note {@code /auth/refresh} is
     * public: it authenticates via the HttpOnly refresh cookie, not a bearer
     * token, and is called precisely when the access token has expired.
     *
     * <p>These are unauthenticated, so they are the endpoints most exposed to
     * abuse — rate limiting belongs here before launch.
     */
    private static final String[] AUTH_PATHS = {
            "/auth/register",
            "/auth/verify-email",
            "/auth/resend-verification",
            "/auth/login",
            "/auth/refresh",
            "/auth/forgot-password",
            "/auth/reset-password",
    };

    private final String allowedOrigins;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint;

    public SecurityConfig(@Value("${manasik.cors.allowed-origins}") String allowedOrigins,
                          JwtService jwtService,
                          RateLimiter rateLimiter,
                          JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint) {
        this.allowedOrigins = allowedOrigins;
        this.rateLimitFilter = new RateLimitFilter(rateLimiter);
        // Constructed here rather than injected as a bean ON PURPOSE. Any Filter
        // bean is auto-registered by Boot into the servlet chain, where it runs
        // before Spring Security — and SecurityContextHolderFilter then wipes the
        // authentication it just set. See JwtAuthenticationFilter's javadoc.
        this.jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService);
        this.jsonAuthenticationEntryPoint = jsonAuthenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Safe to disable only because this is a token-authenticated API
                // with no cookie-driven state-changing requests. When the refresh
                // cookie lands in Phase 4 it is scoped to /v1/auth and SameSite=Lax,
                // and refresh is a POST — revisit this if either changes.
                .csrf(AbstractHttpConfigurer::disable)

                // No server-side session. Every request carries its own proof.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // No browser login form and no HTTP Basic prompt; this API answers
                // with 401 JSON instead of redirecting or challenging.
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)

                // 401 for "who are you", 403 for "not allowed" — without this
                // Spring answers 403 to unauthenticated calls, and the frontend
                // never attempts a token refresh.
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jsonAuthenticationEntryPoint)
                        .accessDeniedHandler(jsonAuthenticationEntryPoint))

                .authorizeHttpRequests(auth -> auth
                        // CORS preflight must never require credentials.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .requestMatchers(AUTH_PATHS).permitAll()
                        .anyRequest().authenticated()
                )

                // Must run before authorization, or every request is anonymous.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Ahead of the JWT filter: a rejected request should cost as
                // little work as possible, and rate limiting must not be
                // skippable by sending a malformed token.
                .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Exact origins only. `*` is rejected by browsers when credentials are
        // allowed, and we need credentials for the refresh cookie.
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList());

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Accept-Language"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * BCrypt at strength 12.
     *
     * <p>Defined now so the cost factor is a single decision recorded in one
     * place rather than a magic number sprinkled through the auth service.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
