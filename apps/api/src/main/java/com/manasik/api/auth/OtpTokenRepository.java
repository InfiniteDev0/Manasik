package com.manasik.api.auth;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    /**
     * The most recently issued token for this user and purpose.
     *
     * <p>Deliberately fetches the latest regardless of whether it has been used
     * or has expired, rather than filtering to "the newest unused, unexpired
     * one".
     *
     * <p>That distinction matters for the error message. If we filtered, a code
     * that was already used and a code that never existed would both come back
     * empty, and the user would be told "invalid code" when the truth is "you
     * already used that one" — sending them round the loop again. Loading the
     * row lets the service tell them what actually happened.
     */
    @Query("""
            select t from OtpToken t
            where t.userId = :userId and t.purpose = :purpose
            order by t.createdAt desc""")
    Optional<OtpToken> findLatest(@Param("userId") UUID userId,
                                  @Param("purpose") OtpPurpose purpose,
                                  Limit limit);

    default Optional<OtpToken> findLatest(UUID userId, OtpPurpose purpose) {
        return findLatest(userId, purpose, Limit.of(1));
    }

    /**
     * Invalidates outstanding codes when a new one is issued.
     *
     * <p>Without this, every code ever sent stays valid until it expires, so
     * "resend" quietly widens the attack surface each time it is pressed.
     */
    @Modifying
    @Query("delete from OtpToken t where t.userId = :userId and t.purpose = :purpose")
    int deleteAllForUserAndPurpose(@Param("userId") UUID userId,
                                   @Param("purpose") OtpPurpose purpose);
}
