package com.manasik.api.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, UUID> {

    Optional<RefreshSession> findByJti(UUID jti);

    /**
     * Rotation: retire the presented token.
     *
     * <p>Returns the number of rows deleted, and the caller must check it. If
     * it is zero, the {@code jti} was already gone — that is the reuse signal,
     * and it must not be treated as a successful rotation.
     */
    @Modifying
    @Query("delete from RefreshSession s where s.jti = :jti")
    int deleteByJti(@Param("jti") UUID jti);

    /**
     * Reuse detection response: revoke every session this user holds.
     *
     * <p>Deliberately blunt. A replayed refresh token means one of the user's
     * tokens has leaked, and there is no way to tell which — so all of them go
     * and the user logs in again.
     */
    @Modifying
    @Query("delete from RefreshSession s where s.userId = :userId")
    int deleteAllByUserId(@Param("userId") UUID userId);

    /** Housekeeping for a scheduled job; expired rows are dead weight. */
    @Modifying
    @Query("delete from RefreshSession s where s.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
