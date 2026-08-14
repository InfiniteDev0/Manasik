package com.manasik.api.auth;

import com.manasik.api.auth.dto.AuthResponse;
import com.manasik.api.auth.dto.LoginRequest;
import com.manasik.api.auth.dto.RegisterRequest;
import com.manasik.api.auth.dto.TokenPair;
import com.manasik.api.auth.dto.VerifyEmailRequest;
import com.manasik.api.auth.jwt.JwtService;
import com.manasik.api.auth.jwt.TokenType;
import com.manasik.api.common.exception.BadRequestException;
import com.manasik.api.common.exception.ConflictException;
import com.manasik.api.common.exception.NotFoundException;
import com.manasik.api.email.EmailService;
import com.manasik.api.organization.Membership;
import com.manasik.api.organization.MembershipRepository;
import com.manasik.api.organization.MembershipStatus;
import com.manasik.api.organization.Role;
import com.manasik.api.user.User;
import com.manasik.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Registration, verification, login and session rotation.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final Duration OTP_TTL = Duration.ofMinutes(15);
    private static final short MAX_OTP_ATTEMPTS = 5;

    /**
     * Identical message for "no such account" and "wrong password".
     *
     * <p>Distinguishing them turns the login form into an account-existence
     * oracle: an attacker submits an email list and learns which are real,
     * then targets those with credential stuffing or phishing.
     */
    private static final String INVALID_CREDENTIALS = "Invalid email or password";

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       MembershipRepository membershipRepository,
                       OtpTokenRepository otpTokenRepository,
                       RefreshSessionRepository refreshSessionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates an unverified user and emails a verification code.
     *
     * <p><b>No tokens are issued.</b> An unverified account cannot log in, so
     * registering with someone else's email gains nothing.
     *
     * <p>Trade-off: a duplicate email returns 409, which confirms the address is
     * registered. The privacy-preserving alternative — always return 200 and
     * email the existing owner instead — costs a confusing dead end for the far
     * more common case of someone forgetting they already signed up. Revisit if
     * enumeration becomes a real concern.
     */
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(false);
        userRepository.save(user);

        issueOtp(user, OtpPurpose.VERIFY_EMAIL);
        log.info("Registered user {}", user.getId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Verify email
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponseWithTokens verifyEmail(VerifyEmailRequest request,
                                              String userAgent, String ipAddress) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));

        if (user.isEmailVerified()) {
            throw new ConflictException("This email is already verified");
        }

        consumeOtp(user, OtpPurpose.VERIFY_EMAIL, request.code());

        user.setEmailVerified(true);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        emailService.sendWelcome(user.getEmail(), user.getFullName());

        // A brand-new user has no membership, so the token carries no
        // organization — which is exactly what routes them to create-workspace.
        return buildSession(user, userAgent, ipAddress);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponseWithTokens login(LoginRequest request, String userAgent, String ipAddress) {
        Optional<User> found = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()));

        // Hash a dummy value when the account doesn't exist so both paths take
        // roughly the same time. Without it, an unknown email returns visibly
        // faster than a wrong password, and the timing difference alone leaks
        // which accounts are real.
        if (found.isEmpty()) {
            passwordEncoder.encode(request.password());
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }

        User user = found.get();
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }

        // Checked only AFTER the password matches. Revealing "unverified" to
        // someone who already proved they know the password leaks nothing.
        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email before logging in");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return buildSession(user, userAgent, ipAddress);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh — rotation and reuse detection
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Rotates the session: the presented refresh token is retired and a new
     * pair issued.
     *
     * <p><b>Reuse detection.</b> A valid signature whose {@code jti} has no row
     * means that token was already spent. Either it was replayed, or it leaked
     * and the attacker got there first — and there is no way to tell which. So
     * every session for that user is destroyed and everyone re-authenticates.
     *
     * <p>Without this, a stolen refresh token is thirty days of undetectable
     * access. With it, the theft becomes visible the moment either party uses
     * the token twice.
     */
    // noRollbackFor is ESSENTIAL, not a tweak. Reuse detection deletes every
    // session and then throws — and a rollback would undo the revocation,
    // leaving the leaked token family fully usable. The same applies to
    // discarding an expired session. Every mutation on the throwing paths here
    // is one we intend to keep.
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public TokenPair refresh(String refreshToken, String userAgent, String ipAddress) {
        Jwt jwt;
        try {
            jwt = jwtService.verify(refreshToken, TokenType.REFRESH);
        } catch (JwtException e) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        UUID jti = UUID.fromString(jwt.getId());

        RefreshSession session = refreshSessionRepository.findByJti(jti).orElse(null);

        if (session == null) {
            log.warn("Refresh token reuse detected for user {} (jti {}). Revoking all sessions.",
                    userId, jti);
            refreshSessionRepository.deleteAllByUserId(userId);
            throw new BadCredentialsException("Invalid refresh token");
        }

        if (session.isExpired()) {
            refreshSessionRepository.delete(session);
            throw new BadCredentialsException("Session expired");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        // Retire the presented token before issuing a replacement, so a crash
        // between the two leaves no usable token rather than two.
        refreshSessionRepository.delete(session);

        // Re-resolve the membership rather than trusting the old token's claim:
        // access removed since the last refresh must take effect here.
        UUID organizationId = session.getOrganizationId();
        Role role = resolveRole(userId, organizationId);
        if (organizationId != null && role == null) {
            // Membership revoked or suspended while the session was alive.
            organizationId = null;
        }

        return issueTokens(user, organizationId, role, userAgent, ipAddress);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Idempotent by design: logging out twice, or with a token that is already
     * invalid, still succeeds. A logout that can fail encourages clients to
     * retry or, worse, to leave the session alive.
     */
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        try {
            Jwt jwt = jwtService.verify(refreshToken, TokenType.REFRESH);
            refreshSessionRepository.deleteByJti(UUID.fromString(jwt.getId()));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Logout with an unusable refresh token; ignoring: {}", e.getMessage());
        }
    }

    /**
     * Issues a fresh verification code.
     *
     * <p>Silent for unknown or already-verified addresses, for the same
     * enumeration reason as {@link #forgotPassword}. Issuing a new code also
     * invalidates the previous one, so pressing "resend" repeatedly does not
     * leave a growing set of valid codes.
     */
    @Transactional
    public void resendVerification(String rawEmail) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(rawEmail))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> issueOtp(user, OtpPurpose.VERIFY_EMAIL));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Password recovery
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Emails a reset code — or silently does nothing if the address is unknown.
     *
     * <p><b>Always reports success.</b> Distinguishing "sent" from "no such
     * account" would turn this into an account-existence oracle, and unlike
     * registration there is no UX reason to: the user is told to check their
     * inbox either way, which is exactly what they must do.
     */
    @Transactional
    public void forgotPassword(String rawEmail) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(rawEmail))
                .ifPresentOrElse(
                        user -> issueOtp(user, OtpPurpose.RESET_PASSWORD),
                        () -> log.debug("Password reset requested for unknown address; ignoring"));
    }

    /**
     * Sets a new password and revokes every existing session.
     *
     * <p>The revocation is the point. If the reset was triggered because the
     * account was compromised, leaving the attacker's sessions alive would make
     * the reset cosmetic — they would keep access with the old refresh token
     * regardless of the new password.
     */
    @Transactional
    public void resetPassword(String rawEmail, String code, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(rawEmail))
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));

        consumeOtp(user, OtpPurpose.RESET_PASSWORD, code);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // A user who can complete an email round-trip has demonstrably proved
        // control of the address, so treat that as verification too.
        user.setEmailVerified(true);
        userRepository.save(user);

        int revoked = refreshSessionRepository.deleteAllByUserId(user.getId());
        log.info("Password reset for user {}; revoked {} session(s)", user.getId(), revoked);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Current user
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse currentUser(UUID userId, UUID activeOrganizationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));
        return new AuthResponse(null, toUserResponse(user),
                membershipSummaries(userId), activeOrganizationId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internals
    // ─────────────────────────────────────────────────────────────────────────

    /** Service result: the JSON body plus the refresh token for the cookie. */
    public record AuthResponseWithTokens(AuthResponse response, String refreshToken) {
    }

    private AuthResponseWithTokens buildSession(User user, String userAgent, String ipAddress) {
        List<Membership> memberships = membershipRepository
                .findAllByUserIdAndStatus(user.getId(), MembershipStatus.ACTIVE);

        // First active membership becomes the active workspace. Users with
        // several can switch afterwards; users with none get null, which is the
        // signal to route them to create-workspace.
        Membership active = memberships.isEmpty() ? null : memberships.get(0);
        UUID organizationId = active == null ? null : active.getOrganization().getId();
        Role role = active == null ? null : active.getRole();

        TokenPair tokens = issueTokens(user, organizationId, role, userAgent, ipAddress);

        AuthResponse response = new AuthResponse(
                tokens.accessToken(),
                toUserResponse(user),
                memberships.stream().map(AuthService::toSummary).toList(),
                organizationId);

        return new AuthResponseWithTokens(response, tokens.refreshToken());
    }

    private TokenPair issueTokens(User user, UUID organizationId, Role role,
                                  String userAgent, String ipAddress) {
        UUID jti = UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(jwtService.refreshTtl());

        RefreshSession session = new RefreshSession();
        session.setUserId(user.getId());
        session.setJti(jti);
        session.setOrganizationId(organizationId);
        session.setUserAgent(truncate(userAgent, 255));
        session.setIpAddress(truncate(ipAddress, 45));
        session.setExpiresAt(expiresAt);
        refreshSessionRepository.save(session);

        return new TokenPair(
                jwtService.issueAccessToken(user.getId(), organizationId, role, jti),
                jwtService.issueRefreshToken(user.getId(), organizationId, jti),
                jti);
    }

    private Role resolveRole(UUID userId, UUID organizationId) {
        if (organizationId == null) {
            return null;
        }
        return membershipRepository
                .findActiveMembership(userId, organizationId, MembershipStatus.ACTIVE)
                .map(Membership::getRole)
                .orElse(null);
    }

    /**
     * Issues a 6-digit code, stores only its hash, and invalidates any earlier
     * codes for the same purpose.
     */
    private void issueOtp(User user, OtpPurpose purpose) {
        otpTokenRepository.deleteAllForUserAndPurpose(user.getId(), purpose);

        // SecureRandom, not Math.random(): a predictable verification code is
        // an account takeover.
        String code = String.format(Locale.ROOT, "%06d", secureRandom.nextInt(1_000_000));

        OtpToken token = new OtpToken();
        token.setUserId(user.getId());
        token.setTokenHash(passwordEncoder.encode(code));
        token.setPurpose(purpose);
        token.setExpiresAt(Instant.now().plus(OTP_TTL));
        otpTokenRepository.save(token);

        if (purpose == OtpPurpose.VERIFY_EMAIL) {
            emailService.sendVerificationCode(user.getEmail(), user.getFullName(), code);
        } else {
            emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code);
        }
    }

    /**
     * Validates and burns a code.
     *
     * <p>Loads the latest token regardless of state so "already used" and
     * "expired" get their own messages instead of a generic failure that sends
     * the user round the loop again.
     */
    private void consumeOtp(User user, OtpPurpose purpose, String code) {
        OtpToken token = otpTokenRepository.findLatest(user.getId(), purpose)
                .orElseThrow(() -> new BadRequestException("No code has been requested"));

        if (token.isUsed()) {
            throw new BadRequestException("This code has already been used. Request a new one.");
        }
        if (token.isExpired()) {
            throw new BadRequestException("This code has expired. Request a new one.");
        }
        if (token.getAttempts() >= MAX_OTP_ATTEMPTS) {
            // A 6-digit code is a million guesses; without a cap it is trivially
            // brute-forced within the 15-minute window.
            throw new BadRequestException("Too many incorrect attempts. Request a new code.");
        }

        if (!passwordEncoder.matches(code, token.getTokenHash())) {
            token.setAttempts((short) (token.getAttempts() + 1));
            otpTokenRepository.save(token);
            throw new BadRequestException("Invalid or expired code");
        }

        token.setUsedAt(Instant.now());
        otpTokenRepository.save(token);
    }

    private List<AuthResponse.MembershipSummary> membershipSummaries(UUID userId) {
        return membershipRepository.findAllByUserIdAndStatus(userId, MembershipStatus.ACTIVE)
                .stream().map(AuthService::toSummary).toList();
    }

    private static AuthResponse.MembershipSummary toSummary(Membership membership) {
        var organization = membership.getOrganization();
        return new AuthResponse.MembershipSummary(
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getLogoUrl(),
                membership.getRole());
    }

    private static AuthResponse.UserResponse toUserResponse(User user) {
        return new AuthResponse.UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getAvatarUrl(),
                user.getLocale(),
                user.getLastLoginAt(),
                user.getCreatedAt());
    }

    /** Lowercased and trimmed, matching the {@code LOWER(email)} unique index. */
    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
