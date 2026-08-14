package com.manasik.api.organization;

import com.manasik.api.auth.RefreshSession;
import com.manasik.api.auth.RefreshSessionRepository;
import com.manasik.api.auth.jwt.JwtService;
import com.manasik.api.common.exception.ConflictException;
import com.manasik.api.common.exception.NotFoundException;
import com.manasik.api.organization.dto.CreateOrganizationRequest;
import com.manasik.api.organization.dto.OrganizationResponse;
import com.manasik.api.tenancy.TenantContext;
import com.manasik.api.user.User;
import com.manasik.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

/**
 * Creating and switching workspaces.
 */
@Service
public class OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);
    private static final int TRIAL_DAYS = 14;

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TransactionTemplate transactionTemplate;

    public OrganizationService(OrganizationRepository organizationRepository,
                               MembershipRepository membershipRepository,
                               SubscriptionRepository subscriptionRepository,
                               RefreshSessionRepository refreshSessionRepository,
                               UserRepository userRepository,
                               JwtService jwtService,
                               TransactionTemplate transactionTemplate) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Creates a workspace, makes the caller its OWNER, starts a trial, and
     * reissues the access token carrying the new organization.
     *
     * <h2>Why this runs in TWO transactions</h2>
     *
     * {@code subscriptions} is RLS-protected with a {@code WITH CHECK} clause,
     * so an INSERT is rejected unless {@code organization_id} equals the
     * connection's current tenant. At the moment of creation the caller has no
     * tenant at all — they are creating their first workspace.
     *
     * <p>{@code TenantAwareDataSource} stamps the tenant when a connection is
     * <em>acquired</em>, so setting {@link TenantContext} in the middle of a
     * transaction is too late: that connection is already bound and stamped.
     *
     * <p>Hence:
     * <ol>
     *   <li><b>Tx1</b> — organization + membership. Neither table is
     *       RLS-protected (D6), so no tenant is required.</li>
     *   <li>Set {@link TenantContext} to the new organization.</li>
     *   <li><b>Tx2</b> — subscription, on a freshly acquired connection that
     *       carries the new tenant, so {@code WITH CHECK} passes.</li>
     * </ol>
     *
     * <p>A {@link TransactionTemplate} is used rather than two
     * {@code @Transactional} methods because self-invocation would bypass the
     * proxy and silently collapse them back into one transaction — reintroducing
     * the bug invisibly.
     *
     * <p><b>Consequence to be honest about:</b> the two transactions are not
     * atomic together. If Tx2 fails, the workspace exists without a
     * subscription. That is recoverable (the trial can be created on next
     * access) and strictly better than the alternative, which is a workspace
     * that cannot be created at all.
     */
    public OrganizationResponse createWorkspace(UUID userId, CreateOrganizationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User"));

        // ── Tx1: organization + OWNER membership ────────────────────────────
        Organization organization = transactionTemplate.execute(status -> {
            Organization org = new Organization();
            org.setName(request.name().trim());
            org.setSlug(uniqueSlug(request.name()));
            org.setCountry(request.country().toUpperCase(Locale.ROOT));
            org.setCurrency(request.currency().toUpperCase(Locale.ROOT));
            org.setTimezone(request.timezone().trim());
            org.setStatus(OrganizationStatus.ACTIVE);
            organizationRepository.save(org);

            Membership membership = new Membership();
            membership.setUser(user);
            membership.setOrganization(org);
            membership.setRole(Role.OWNER);
            membership.setStatus(MembershipStatus.ACTIVE);
            membership.setJoinedAt(Instant.now());
            membershipRepository.save(membership);

            return org;
        });

        // ── Switch the thread's tenant to the workspace just created ────────
        TenantContext.set(organization.getId(), userId);

        // ── Tx2: trial subscription, on a re-stamped connection ─────────────
        transactionTemplate.executeWithoutResult(status -> {
            Subscription subscription = new Subscription();
            subscription.setPlan(SubscriptionPlan.TRIAL);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setTrialEndsAt(Instant.now().plus(TRIAL_DAYS, ChronoUnit.DAYS));
            // organizationId is NOT set here: @TenantId means Hibernate stamps
            // it from the active tenant, which is now this organization.
            subscriptionRepository.save(subscription);
        });

        log.info("User {} created organization {} ({})",
                userId, organization.getId(), organization.getSlug());

        String accessToken = reissueAccessToken(userId, organization.getId(), Role.OWNER);
        return OrganizationResponse.of(organization, Role.OWNER, accessToken);
    }

    /**
     * Switches the active workspace and reissues the access token.
     *
     * <p>The membership is re-verified here rather than trusted from the
     * request. Without that check, any authenticated user could switch into any
     * organization simply by sending its id — the client would be choosing its
     * own tenant, which is precisely what the whole isolation design forbids.
     */
    public OrganizationResponse switchWorkspace(UUID userId, UUID organizationId) {
        Membership membership = membershipRepository
                .findActiveMembership(userId, organizationId, MembershipStatus.ACTIVE)
                // 404, not 403: a 403 would confirm the organization exists,
                // letting a caller probe for valid ids.
                .orElseThrow(() -> NotFoundException.of("Workspace"));

        Organization organization = membership.getOrganization();
        String accessToken = reissueAccessToken(userId, organizationId, membership.getRole());

        return OrganizationResponse.of(organization, membership.getRole(), accessToken);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Issues a fresh access token for the new active organization, and points
     * the caller's live refresh sessions at it too.
     *
     * <p>Otherwise the next silent refresh would resurrect the previous
     * workspace and the user would appear to switch back on their own.
     */
    private String reissueAccessToken(UUID userId, UUID organizationId, Role role) {
        return transactionTemplate.execute(status -> {
            for (RefreshSession session : refreshSessionRepository.findAllByUserId(userId)) {
                session.setOrganizationId(organizationId);
                refreshSessionRepository.save(session);
            }
            // Reuses the existing jti: this is the same session, now pointed at
            // a different workspace. Rotation is for refresh, not for switching.
            UUID jti = UUID.randomUUID();
            return jwtService.issueAccessToken(userId, organizationId, role, jti);
        });
    }

    /**
     * URL-safe slug, made unique with a short suffix on collision.
     *
     * <p>Two agencies can legitimately share a name, so uniqueness cannot come
     * from the name alone — and the database has a unique index that would
     * otherwise turn that into a 500.
     */
    private String uniqueSlug(String name) {
        String base = slugify(name);
        if (base.isEmpty()) {
            base = "agency";
        }
        if (!organizationRepository.existsBySlugIgnoreCase(base)) {
            return base;
        }
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = base + "-" + UUID.randomUUID().toString().substring(0, 6);
            if (!organizationRepository.existsBySlugIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new ConflictException("Could not generate a unique workspace address. Try another name.");
    }

    /** Strips accents so "Baraka Voyages Genève" becomes "baraka-voyages-geneve". */
    private static String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .substring(0, Math.min(normalized.length(), 60))
                .replaceAll("-+$", "");
    }
}
