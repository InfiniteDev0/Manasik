package com.manasik.api.common.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Caps request rates on the unauthenticated endpoints.
 *
 * <p>These are the only routes reachable without a token, which makes them the
 * ones worth attacking: credential stuffing against login, and brute-forcing a
 * six-digit OTP against verify.
 *
 * <p>The per-token attempt cap in {@code AuthService} is not sufficient on its
 * own — an attacker can simply request a fresh code each time. This limits the
 * requests themselves.
 *
 * <p>Deliberately not a {@code @Component}: see {@code JwtAuthenticationFilter}.
 * It is added to the security chain explicitly by {@code SecurityConfig}.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /**
     * Per-path limits, keyed by client IP.
     *
     * <p>Login gets a tighter budget than registration because it is the
     * credential-stuffing target. Verification is tightest of all: six digits
     * is a million possibilities, and without a cap here an attacker could work
     * through a meaningful fraction of them.
     */
    private static final List<Rule> RULES = List.of(
            new Rule("/auth/login", 10, Duration.ofMinutes(15)),
            new Rule("/auth/register", 5, Duration.ofHours(1)),
            new Rule("/auth/verify-email", 10, Duration.ofMinutes(15)),
            new Rule("/auth/resend-verification", 3, Duration.ofMinutes(15)),
            new Rule("/auth/forgot-password", 3, Duration.ofMinutes(15)),
            new Rule("/auth/reset-password", 10, Duration.ofMinutes(15))
    );

    private final RateLimiter rateLimiter;

    public RateLimitFilter(RateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // getServletPath() excludes the /v1 context path, matching the rules above.
        Rule rule = RULES.stream()
                .filter(r -> r.path.equals(request.getServletPath()))
                .findFirst()
                .orElse(null);

        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.path + "|" + clientIp(request);

        if (!rateLimiter.tryAcquire(key, rule.limit, rule.window)) {
            long retryAfter = rateLimiter.secondsUntilReset(key);
            log.warn("Rate limit exceeded for {} from {}", rule.path, clientIp(request));
            reject(response, request.getRequestURI(), retryAfter);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static void reject(HttpServletResponse response, String path, long retryAfter)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter));

        response.getWriter().write("""
                {"status":429,"error":"Too Many Requests","message":"Too many attempts. Try again in %d seconds.","path":"%s","timestamp":"%s"}"""
                .formatted(retryAfter, path.replace("\"", ""), Instant.now()));
    }

    /**
     * ⚠️ {@code X-Forwarded-For} is client-supplied and spoofable. Behind a
     * proxy that overwrites it this is correct; exposed directly to the
     * internet, an attacker can rotate the header to defeat the limit.
     *
     * <p>Acceptable while the API sits behind a single trusted proxy. If it is
     * ever exposed directly, trust {@code getRemoteAddr()} only.
     */
    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record Rule(String path, int limit, Duration window) {
    }
}
