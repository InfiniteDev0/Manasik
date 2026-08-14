package com.manasik.api.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    @Query("select o from Organization o where lower(o.slug) = lower(:slug)")
    Optional<Organization> findBySlugIgnoreCase(@Param("slug") String slug);

    @Query("select count(o) > 0 from Organization o where lower(o.slug) = lower(:slug)")
    boolean existsBySlugIgnoreCase(@Param("slug") String slug);
}
