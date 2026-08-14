package com.manasik.api.auth;

import com.manasik.api.auth.dto.AuthResponse;
import com.manasik.api.auth.dto.LoginRequest;
import com.manasik.api.auth.dto.RegisterRequest;
import com.manasik.api.auth.dto.TokenPair;
import com.manasik.api.auth.dto.VerifyEmailRequest;
import com.manasik.api.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

/**
 * Authentication endpoints, served under {@code /v1/auth}.
 *
 * <p>The refresh token is only ever delivered as an HttpOnly cookie and never
 * in a response body — see {@link #refreshCookie}.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication")
public class AuthController {

    static final String REFRESH_COOKIE = "manasik_rt";

    /**
     * Scoped to the auth endpoints, so the cookie is not attached to every
     * request to the API. A cookie sent everywhere is a cookie exposed
     * everywhere.
     *
     * <p>Includes the {@code /v1} context path because browsers match cookie
     * paths against the full request URI.
     */
    static final String REFRESH_COOKIE_PATH = "/v1/auth";

    private final AuthService authService;
    private final Duration refreshTtl;
    private final boolean secureCookie;

    public AuthController(AuthService authService,
                          com.manasik.api.auth.jwt.JwtService jwtService,
                          @Value("${manasik.cookie.secure:false}") boolean secureCookie) {
        this.authService = authService;
        this.refreshTtl = jwtService.refreshTtl();
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    @SecurityRequirements
    @Operation(summary = "Create an account",
            description = "Creates a person, not an agency. No tokens are issued until the email is verified.")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.message("Account created. Check your email for a verification code."));
    }

    @PostMapping("/verify-email")
    @SecurityRequirements
    @Operation(summary = "Verify email and start a session")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request, HttpServletRequest servletRequest) {

        var result = authService.verifyEmail(request,
                servletRequest.getHeader(HttpHeaders.USER_AGENT), clientIp(servletRequest));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.of(result.response()));
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Log in",
            description = "Returns the access token in the body and the refresh token as an HttpOnly cookie.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {

        var result = authService.login(request,
                servletRequest.getHeader(HttpHeaders.USER_AGENT), clientIp(servletRequest));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken()).toString())
                .body(ApiResponse.of(result.response()));
    }

    /**
     * Rotates the session. Takes no body — the refresh token comes from the
     * cookie, which JavaScript cannot read.
     */
    @PostMapping("/refresh")
    @SecurityRequirements
    @Operation(summary = "Rotate the session")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletRequest servletRequest) {

        TokenPair tokens = authService.refresh(refreshToken,
                servletRequest.getHeader(HttpHeaders.USER_AGENT), clientIp(servletRequest));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(tokens.refreshToken()).toString())
                .body(ApiResponse.of(Map.of("accessToken", tokens.accessToken())));
    }

    @PostMapping("/logout")
    @Operation(summary = "End the session")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {

        authService.logout(refreshToken);

        // Same name, path and attributes with maxAge 0 — a browser only removes
        // a cookie when those match the one it stored.
        ResponseCookie cleared = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .body(ApiResponse.message("Logged out"));
    }

    @GetMapping("/me")
    @Operation(summary = "The authenticated user and their workspaces")
    public ApiResponse<AuthResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ApiResponse.of(
                authService.currentUser(principal.userId(), principal.organizationId()));
    }

    // ─────────────────────────────────────────────────────────────────────────

    private ResponseCookie refreshCookie(String token) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                // Unreadable from JavaScript: an XSS bug then costs at most the
                // 15-minute access token, not a 30-day session.
                .httpOnly(true)
                // HTTPS only in production; false locally so http://localhost works.
                .secure(secureCookie)
                // Lax, not Strict: the cookie must survive following a link back
                // into the app from a verification email.
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(refreshTtl)
                .build();
    }

    /**
     * Best-effort client IP, for the session record.
     *
     * <p>{@code X-Forwarded-For} is client-supplied and trivially spoofed, so
     * this is diagnostic only — never use it for authorization or rate limiting
     * without a trusted proxy in front.
     */
    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
