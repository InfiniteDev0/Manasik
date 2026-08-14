package com.manasik.api.auth;

import com.manasik.api.auth.jwt.JwtService;
import com.manasik.api.auth.jwt.TokenType;
import com.manasik.api.organization.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Authenticates requests carrying {@code Authorization: Bearer <access token>}.
 *
 * <p>Stateless: the token is verified cryptographically and the principal is
 * rebuilt from its claims, with no database lookup.
 *
 * <h2>The trade-off that involves</h2>
 *
 * Because nothing is checked against the database, a membership revoked one
 * minute ago remains usable until the access token expires. That window is
 * bounded by the 15-minute access TTL, and revocation takes full effect at the
 * next refresh — where the membership <em>is</em> re-checked.
 *
 * <p>The alternative, a query per request, would put a database round-trip in
 * front of every single call to buy a shorter window. Fifteen minutes is the
 * deliberate choice; if a future requirement demands instant revocation, that
 * is what shortening the access TTL is for.
 *
 * <p>Invalid tokens do not fail the request here — the filter simply leaves the
 * context unauthenticated and lets the authorization rules decide. That keeps
 * public endpoints reachable with a stale token still sitting in a browser tab.
 *
 * <h2>Deliberately NOT a {@code @Component}</h2>
 *
 * Spring Boot auto-registers every {@code Filter} bean into the servlet chain,
 * where it runs <em>before</em> Spring Security. This filter would then set the
 * {@code SecurityContext}, and {@code SecurityContextHolderFilter} would
 * immediately overwrite it with the empty persisted context — silently
 * discarding the authentication, so every request looked anonymous despite a
 * perfectly valid token.
 *
 * <p>It is therefore constructed directly in {@code SecurityConfig} and added
 * to the security chain only.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                authenticate(token, request);
            } catch (JwtException e) {
                // Expired or tampered. Logged at debug because an expired token
                // is ordinary traffic — the frontend refreshes and retries.
                log.debug("Rejected bearer token on {}: {}", request.getRequestURI(), e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        Jwt jwt = jwtService.verify(token, TokenType.ACCESS);

        UUID userId = UUID.fromString(jwt.getSubject());
        String orgClaim = jwt.getClaimAsString(JwtService.CLAIM_ORGANIZATION);
        String roleClaim = jwt.getClaimAsString(JwtService.CLAIM_ROLE);

        UUID organizationId = orgClaim == null ? null : UUID.fromString(orgClaim);
        Role role = roleClaim == null ? null : Role.valueOf(roleClaim);

        AuthenticatedUser principal = new AuthenticatedUser(userId, organizationId, role);

        // Spring Security's convention is a ROLE_ prefix for hasRole() checks.
        // A user with no workspace gets no authorities at all, so anything
        // requiring a role is closed to them until they create or join one.
        List<SimpleGrantedAuthority> authorities = role == null
                ? List.of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));

        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static String extractToken(HttpServletRequest request) {
        String header = request.getHeader(HEADER);
        if (header == null || !header.startsWith(PREFIX)) {
            return null;
        }
        String token = header.substring(PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }
}
