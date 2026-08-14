package com.manasik.api.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * Returns JSON 401/403 instead of Spring Security's defaults.
 *
 * <h2>Why this exists</h2>
 *
 * Without an entry point, {@code AuthorizationFilter} denies the anonymous user
 * and the response is <strong>403 Forbidden</strong> — even when the caller
 * simply did not authenticate. That is wrong, and it actively breaks the
 * frontend: {@code lib/api.ts} refreshes its access token on 401. A 403 means
 * it never tries, and the user is logged out by a merely expired token.
 *
 * <p>The distinction this restores:
 * <ul>
 *   <li><b>401</b> — "I don't know who you are." Refresh and retry.</li>
 *   <li><b>403</b> — "I know who you are, and no." Do not retry.</li>
 * </ul>
 *
 * <p>Responses are written by hand rather than through Jackson: the shape is
 * fixed and tiny, and this avoids taking a dependency on which Jackson major
 * version Boot happens to autoconfigure.
 */
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Authentication required", request.getRequestURI());
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        write(response, HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action", request.getRequestURI());
    }

    private static void write(HttpServletResponse response, HttpStatus status,
                              String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // Mirrors com.manasik.api.common.ApiError so clients see one error shape.
        String body = """
                {"status":%d,"error":"%s","message":"%s","path":"%s","timestamp":"%s"}"""
                .formatted(status.value(),
                        escape(status.getReasonPhrase()),
                        escape(message),
                        escape(path),
                        Instant.now());

        response.getWriter().write(body);
    }

    /**
     * Minimal JSON string escaping.
     *
     * <p>{@code path} comes from the request, so it is attacker-controlled — an
     * unescaped quote there would let a caller inject arbitrary JSON into an
     * error body.
     */
    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
