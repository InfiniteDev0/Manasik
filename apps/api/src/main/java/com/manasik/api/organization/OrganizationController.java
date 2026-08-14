package com.manasik.api.organization;

import com.manasik.api.auth.AuthenticatedUser;
import com.manasik.api.common.ApiResponse;
import com.manasik.api.organization.dto.CreateOrganizationRequest;
import com.manasik.api.organization.dto.OrganizationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Workspace creation and switching.
 *
 * <p>Both endpoints require authentication but <strong>not</strong> an existing
 * workspace — a user with no membership must be able to create their first one,
 * which is the whole point of the post-verification flow.
 */
@RestController
@RequestMapping("/organizations")
@Tag(name = "Organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    @Operation(summary = "Create a workspace",
            description = """
                    Creates the organization, makes the caller its OWNER, and starts a 14-day trial.
                    Returns a NEW access token carrying the new organization — the old one has no
                    tenant and cannot reach any workspace data.""")
    public ResponseEntity<ApiResponse<OrganizationResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody CreateOrganizationRequest request) {

        OrganizationResponse response =
                organizationService.createWorkspace(principal.userId(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response,
                "Workspace created. Use the returned accessToken for subsequent requests."));
    }

    @PostMapping("/{organizationId}/switch")
    @Operation(summary = "Switch the active workspace",
            description = """
                    Verifies the caller holds an ACTIVE membership, then reissues the access token
                    for that organization. This is the ONLY way the active tenant changes — the
                    client never asserts a tenant on a request.""")
    public ApiResponse<OrganizationResponse> switchWorkspace(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID organizationId) {

        return ApiResponse.of(
                organizationService.switchWorkspace(principal.userId(), organizationId));
    }
}
