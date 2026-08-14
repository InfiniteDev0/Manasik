package com.manasik.api.tenancy;

import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

/**
 * Stamps the tenant onto every connection handed out by the pool, so the
 * Postgres RLS policies from {@code V2__row_level_security.sql} have something
 * to filter on.
 *
 * <h2>The pooling hazard, and how this avoids it</h2>
 *
 * A pooled connection outlives the request that used it. The obvious
 * implementation — "set the tenant when a request needs it" — leaves the
 * previous tenant's id on the connection when it returns to the pool. The next
 * request to borrow it inherits that id and reads another agency's rows.
 *
 * <p>The usual patch is to RESET on release, which fails the moment a release
 * path is missed: an exception, a leaked connection, a timeout.
 *
 * <p>So this class does not rely on cleanup. It <strong>writes the setting on
 * every single acquisition</strong>, including when there is no tenant — in
 * which case it writes an empty string. {@code app_current_organization()}
 * maps that to NULL via {@code NULLIF}, and {@code organization_id = NULL} is
 * never true, so a connection with no tenant sees nothing.
 *
 * <p>Stale state is therefore impossible: it is always overwritten before use,
 * and the fallback is zero rows rather than everyone's rows.
 *
 * <h2>Why not SET LOCAL</h2>
 *
 * {@code SET LOCAL} is scoped to a transaction and silently does nothing
 * outside one. Connections are acquired for non-transactional work too, so a
 * session-level setting (third argument {@code false}) is the reliable choice.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

    /**
     * {@code set_config} is used rather than string-concatenated {@code SET}
     * because it takes the value as a bind parameter. A UUID could not carry an
     * injection anyway, but this keeps it structurally impossible.
     */
    private static final String APPLY_TENANT_SQL = """
            select set_config('app.current_organization', ?, false),
                   set_config('app.current_user_id', ?, false)""";

    public TenantAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return applyTenant(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return applyTenant(super.getConnection(username, password));
    }

    private Connection applyTenant(Connection connection) throws SQLException {
        String organizationId = TenantContext.getOrganizationId().map(UUID::toString).orElse("");
        String userId = TenantContext.getUserId().map(UUID::toString).orElse("");

        try (PreparedStatement statement = connection.prepareStatement(APPLY_TENANT_SQL)) {
            statement.setString(1, organizationId);
            statement.setString(2, userId);
            statement.execute();
        } catch (SQLException e) {
            // Hand the connection back rather than leaking it out of the pool,
            // then fail. Continuing with an unstamped connection would mean
            // running queries with whatever tenant the previous borrower left.
            connection.close();
            throw e;
        }

        return connection;
    }
}
