package com.manasik.api.tenancy;

import com.manasik.api.AbstractIntegrationTest;
import com.manasik.api.organization.Subscription;
import com.manasik.api.organization.SubscriptionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ROADMAP Checkpoint 3 — proof that one agency cannot see another's data.
 *
 * <p>This is the most important test in the codebase. Everything else is a
 * feature; this is the thing that, if wrong, exposes one customer's pilgrims,
 * passports and payments to a competitor.
 *
 * <p>It deliberately attacks the problem from two independent directions,
 * because the two mechanisms fail differently:
 *
 * <ol>
 *   <li><b>Hibernate {@code @TenantId}</b> — convenient, and bypassed entirely
 *       by native SQL.</li>
 *   <li><b>Postgres RLS</b> — enforced by the database regardless of what the
 *       application does, and silently inert if the connecting role holds
 *       BYPASSRLS.</li>
 * </ol>
 *
 * A test that only exercised the first would pass on a database with no RLS at
 * all. A test that only exercised the second would miss a broken tenant
 * resolver. Both are required.
 */
class TenantIsolationIT extends AbstractIntegrationTest {

    private static final UUID ORG_A = UUID.randomUUID();
    private static final UUID ORG_B = UUID.randomUUID();
    private static UUID dualMemberUserId;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    /** The application's pool — connects as the restricted {@code manasik_app} role. */
    @Autowired
    private DataSource applicationDataSource;

    private static boolean seeded = false;

    /**
     * Seeds once, but from {@code @BeforeEach} rather than {@code @BeforeAll}.
     *
     * <p>{@code @BeforeAll} runs before Spring builds the application context,
     * which is when Flyway migrates — so the tables do not exist yet at that
     * point. By {@code @BeforeEach} the context is up and the schema is real.
     */
    @BeforeEach
    void seedOnce() throws SQLException {
        if (seeded) {
            return;
        }
        // Seeded as the OWNER, deliberately: setup must not be subject to the
        // very filtering under test, or we could not create B's data at all.
        try (Connection c = ownerConnection()) {
            insertOrganization(c, ORG_A, "Baraka Travels", "baraka-travels", "KE", "KES");
            insertOrganization(c, ORG_B, "Rival Umrah Co", "rival-umrah", "SO", "USD");

            insertSubscription(c, ORG_A, "PROFESSIONAL");
            insertSubscription(c, ORG_B, "STARTER");

            // A person who legitimately belongs to BOTH agencies. This is the
            // case a naive "filter by organization_id" implementation passes and
            // a broken tenant context fails.
            dualMemberUserId = insertUser(c, "ahmed@example.com", "Ahmed Mohamed");
            insertMembership(c, dualMemberUserId, ORG_A, "OWNER");
            insertMembership(c, dualMemberUserId, ORG_B, "GUIDE");
        }
        seeded = true;
    }

    @AfterEach
    void clearTenant() {
        // Mirrors TenantFilter's finally block. Without it, one test's tenant
        // leaks into the next — the exact production bug this suite exists to
        // catch, reproduced inside the test suite itself.
        TenantContext.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Hibernate @TenantId
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Hibernate: querying as org A returns only org A's rows")
    void hibernateFiltersToActiveTenant() {
        TenantContext.set(ORG_A, dualMemberUserId);

        List<Subscription> visible = subscriptionRepository.findAll();

        assertThat(visible)
                .as("findAll() must be scoped to the active tenant without any explicit filter")
                .hasSize(1);
        assertThat(visible.get(0).getOrganizationId()).isEqualTo(ORG_A);
        assertThat(visible)
                .extracting(Subscription::getOrganizationId)
                .as("org B's subscription must be invisible")
                .doesNotContain(ORG_B);
    }

    @Test
    @DisplayName("Hibernate: no active tenant returns nothing, not everything")
    void noTenantSeesNothing() {
        // The critical failure direction. A tenant-less connection must fail
        // CLOSED (zero rows), never open (all rows).
        List<Subscription> visible = subscriptionRepository.findAll();

        assertThat(visible)
                .as("an unauthenticated/tenant-less context must see no tenant data at all")
                .isEmpty();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Postgres RLS, independent of Hibernate
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("RLS: raw SQL as org A cannot reach org B, bypassing Hibernate entirely")
    void rowLevelSecurityHoldsForRawSql() throws SQLException {
        TenantContext.set(ORG_A, dualMemberUserId);

        // Native SQL through the application pool. Hibernate's @TenantId plays
        // no part here — if RLS is not genuinely enforced, org B appears.
        List<UUID> visible = new ArrayList<>();
        try (Connection c = applicationDataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("select organization_id from manasik.subscriptions")) {
            while (rs.next()) {
                visible.add(rs.getObject("organization_id", UUID.class));
            }
        }

        assertThat(visible)
                .as("RLS must filter native SQL; if this fails the app role likely has BYPASSRLS")
                .containsExactly(ORG_A);
    }

    @Test
    @DisplayName("RLS: the app role must not be able to bypass row-level security")
    void applicationRoleCannotBypassRls() throws SQLException {
        // Guards the guard. If someone grants BYPASSRLS or SUPERUSER to the
        // runtime role, every isolation test above keeps passing while the
        // database-level protection silently disappears.
        try (Connection c = applicationDataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "select rolbypassrls, rolsuper from pg_roles where rolname = current_user");
             ResultSet rs = ps.executeQuery()) {

            assertThat(rs.next()).isTrue();
            assertThat(rs.getBoolean("rolbypassrls"))
                    .as("runtime role must NOT hold BYPASSRLS - it would make all RLS decorative")
                    .isFalse();
            assertThat(rs.getBoolean("rolsuper"))
                    .as("runtime role must NOT be a superuser - superusers ignore RLS")
                    .isFalse();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. The dual-membership case
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Dual membership: a member of both A and B, active in A, sees only A")
    void dualMemberSeesOnlyActiveOrganization() throws SQLException {
        // Ahmed genuinely belongs to both agencies, so "is this user allowed?"
        // is true for both. Isolation must come from the ACTIVE organization on
        // the token, not from whether a membership exists.
        TenantContext.set(ORG_A, dualMemberUserId);
        assertThat(subscriptionRepository.findAll())
                .extracting(Subscription::getOrganizationId)
                .containsExactly(ORG_A);

        // Switching workspace must switch what is visible - both ways.
        TenantContext.clear();
        TenantContext.set(ORG_B, dualMemberUserId);
        assertThat(subscriptionRepository.findAll())
                .extracting(Subscription::getOrganizationId)
                .as("after switching to B, A's data must no longer be visible")
                .containsExactly(ORG_B);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seeding helpers — run as the table owner
    // ─────────────────────────────────────────────────────────────────────────

    private static Connection ownerConnection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    private static void insertOrganization(Connection c, UUID id, String name, String slug,
                                           String country, String currency) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("""
                insert into manasik.organizations (id, name, slug, country, currency, timezone, status)
                values (?, ?, ?, ?, ?, 'Africa/Nairobi', 'ACTIVE')""")) {
            ps.setObject(1, id);
            ps.setString(2, name);
            ps.setString(3, slug);
            ps.setString(4, country);
            ps.setString(5, currency);
            ps.executeUpdate();
        }
    }

    private static void insertSubscription(Connection c, UUID organizationId, String plan)
            throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("""
                insert into manasik.subscriptions (organization_id, plan, status)
                values (?, ?, 'ACTIVE')""")) {
            ps.setObject(1, organizationId);
            ps.setString(2, plan);
            ps.executeUpdate();
        }
    }

    private static UUID insertUser(Connection c, String email, String fullName) throws SQLException {
        UUID id = UUID.randomUUID();
        try (PreparedStatement ps = c.prepareStatement("""
                insert into manasik.users (id, full_name, email, password_hash, email_verified)
                values (?, ?, ?, 'not-a-real-hash', true)""")) {
            ps.setObject(1, id);
            ps.setString(2, fullName);
            ps.setString(3, email);
            ps.executeUpdate();
        }
        return id;
    }

    private static void insertMembership(Connection c, UUID userId, UUID organizationId, String role)
            throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("""
                insert into manasik.memberships (user_id, organization_id, role, status, joined_at)
                values (?, ?, ?, 'ACTIVE', now())""")) {
            ps.setObject(1, userId);
            ps.setObject(2, organizationId);
            ps.setString(3, role);
            ps.executeUpdate();
        }
    }
}
