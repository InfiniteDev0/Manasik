package com.manasik.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Case-insensitive lookup, matching the {@code LOWER(email)} unique index.
     *
     * <p>Written as an explicit query rather than {@code findByEmailIgnoreCase}
     * so the generated SQL is {@code lower(email) = lower(?)} — the exact
     * expression the index is built on. A derived method can produce a
     * predicate the planner won't match to that index, turning every login into
     * a sequential scan.
     */
    @Query("select u from User u where lower(u.email) = lower(:email)")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Query("select count(u) > 0 from User u where lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);
}
