'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, Loader, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ApiError } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Switches the active agency.
 *
 * <h2>Why this cannot just navigate</h2>
 *
 * The active organization lives in the JWT, not in the URL. Tenant isolation is
 * enforced server-side from that claim, so changing which workspace you are in
 * means asking the API to <strong>reissue the token</strong> — the client is
 * never allowed to assert a tenant of its own.
 *
 * <p>That is also why a failed switch must not update local state: showing the
 * new workspace's name while still holding the old token would display one
 * agency's chrome over another agency's data.
 */
export function WorkspaceSwitcher() {
  const router = useRouter();
  const memberships = useAuthStore((state) => state.memberships);
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId);
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);

  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const active = memberships.find((m) => m.organizationId === activeOrganizationId);
  const others = memberships.filter((m) => m.organizationId !== activeOrganizationId);


  async function handleSwitch(organizationId: string) {
    if (organizationId === activeOrganizationId || switchingTo) {
      return;
    }

    setSwitchingTo(organizationId);
    try {
      const organization = await authApi.switchWorkspace(organizationId);
      // Only now is it safe to update local state — we hold a token scoped to
      // the new organization.
      setActiveOrganization(organization.id, organization.accessToken);
      // Re-render server data for the new tenant.
      router.refresh();
      toast.success(`Switched to ${organization.name}`);
    } catch (error) {
      // A 404 here means the membership was revoked while the page was open.
      toast.error(
        error instanceof ApiError && error.status === 404
          ? 'You no longer have access to that workspace.'
          : 'Could not switch workspace. Try again.',
      );
    } finally {
      setSwitchingTo(null);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="bg-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-cyan-800 text-primary-foreground">
                  <img src="/manasiklogowhite.png" className='size-6' alt="" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {active?.organizationName ?? 'No workspace'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {active ? titleCase(active.role) : 'Create one to get started'}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />

          <DropdownMenuContent align="start" sideOffset={6} className="w-72 rounded-lg p-0">
            {/* Current workspace */}
            {active && (
              <div className="flex items-start gap-3 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BuildingIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.organizationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {titleCase(active.role)} · {active.organizationSlug}
                  </p>
                </div>
              </div>
            )}

            <DropdownMenuSeparator className="my-0" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 pt-2 text-xs font-medium text-muted-foreground">
                Switch workspace
              </DropdownMenuLabel>

              {memberships.map((membership) => {
                const isActive = membership.organizationId === activeOrganizationId;
                const isSwitching = switchingTo === membership.organizationId;

                return (
                  <DropdownMenuItem
                    key={membership.organizationId}
                    className="mx-1 gap-2 rounded-lg"
                    disabled={isSwitching}
                    onClick={() => handleSwitch(membership.organizationId)}
                  >
                    <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold uppercase">
                      {membership.organizationName.charAt(0)}
                    </span>
                    <span className="flex-1 truncate text-sm">
                      {membership.organizationName}
                    </span>
                    {isSwitching ? (
                      <Loader className="size-4 animate-spin" />
                    ) : (
                      isActive && <CheckIcon className="size-4" />
                    )}
                  </DropdownMenuItem>
                );
              })}

              {others.length === 0 && (
                <p className="px-3 pb-1 text-xs text-muted-foreground">
                  This is your only workspace.
                </p>
              )}
            </DropdownMenuGroup>

            <div className="p-2">
              <button
                type="button"
                onClick={() => router.push('/onboarding')}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm transition hover:bg-muted/60"
              >
                <PlusIcon className="size-4" />
                New workspace
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** OWNER -> Owner. Roles are stored uppercase; shouting at the user is not required. */
function titleCase(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
