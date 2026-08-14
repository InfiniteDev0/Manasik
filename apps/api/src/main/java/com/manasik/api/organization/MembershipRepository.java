package com.manasik.api.organization;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    /**
     * Every organization this user belongs to — the workspace switcher, and the
     * post-login decision about where to send them.
     *
     * <p>{@code @EntityGraph} fetches the organization in the same query.
     * Without it, rendering N workspaces triggers N extra selects (the classic
     * N+1), because the association is LAZY.
     */
    @EntityGraph(attributePaths = "organization")
    @Query("""
            select m from Membership m
            where m.user.id = :userId and m.status = :status
            order by m.joinedAt asc nulls last""")
    List<Membership> findAllByUserIdAndStatus(@Param("userId") UUID userId,
                                              @Param("status") MembershipStatus status);

    /**
     * The authorization check behind every tenant-scoped request and every
     * workspace switch: does this user actually hold an ACTIVE membership in
     * this organization?
     *
     * <p>A token's {@code organizationId} claim must be validated against this
     * — otherwise a user who was removed from an agency keeps access until
     * their token expires.
     */
    // Fetches the organization in the same query. It is LAZY by default, and
    // callers here read its name/slug outside any transaction — with
    // `open-in-view: false` that is a LazyInitializationException, not a silent
    // extra select.
    @EntityGraph(attributePaths = "organization")
    @Query("""
            select m from Membership m
            where m.user.id = :userId
              and m.organization.id = :organizationId
              and m.status = :status""")
    Optional<Membership> findActiveMembership(@Param("userId") UUID userId,
                                              @Param("organizationId") UUID organizationId,
                                              @Param("status") MembershipStatus status);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
