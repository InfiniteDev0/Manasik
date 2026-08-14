package com.manasik.api.tenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Populates {@link TenantContext} for the duration of a request, and clears it
 * afterwards no matter what happens.
 *
 * <p>The {@code finally} block is the entire point of this class. Tomcat reuses
 * threads; a request that sets the tenant and then throws would otherwise leave
 * its organization id on the thread for whoever is served next. That is a
 * cross-agency data leak, and it would only show under load — exactly when it
 * is hardest to reproduce.
 *
 * <p>Ordered {@link Ordered#LOWEST_PRECEDENCE} so it runs <em>after</em> Spring
 * Security's filter chain has authenticated the request. Running earlier would
 * find an empty {@code SecurityContext} and set no tenant at all.
 *
 * <p>Until Phase 4 supplies a {@link TenantPrincipal}, this reliably sets no
 * tenant — which means RLS-protected tables return nothing. That is the correct
 * direction to fail.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null
                    && authentication.isAuthenticated()
                    && authentication.getPrincipal() instanceof TenantPrincipal principal) {
                TenantContext.set(principal.getOrganizationId(), principal.getUserId());
            }

            filterChain.doFilter(request, response);
        } finally {
            // Non-negotiable. See the class comment.
            TenantContext.clear();
        }
    }
}
