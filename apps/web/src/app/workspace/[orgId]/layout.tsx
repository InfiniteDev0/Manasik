'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/workspace/app-sidebar';
import { LiveClock } from '@/components/workspace/live-clock';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { WorkspaceBreadcrumb } from '@/features/workspace/workspace-breadcrumb';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Workspace shell — sidebar + header, applied to every /workspace/[orgId] page.
 *
 * <h2>Why this is a client component</h2>
 *
 * The reference implementation this is modelled on guarded membership in an
 * async server component. That works when the session is a cookie the server
 * can read. Ours is not: the access token lives in memory on the client, and
 * only the HttpOnly <em>refresh</em> cookie ever reaches a server. So the guard
 * runs here, and the API independently enforces the same rule on every request
 * — the client-side check is for routing, not security.
 *
 * <h2>Reconciling the URL with the token</h2>
 *
 * The active organization lives in the JWT, not in the URL. A deep link to a
 * workspace the current token is not scoped to would otherwise render that
 * agency's name over a different agency's data. So when they disagree, the
 * token is switched first and the page waits.
 */
export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const memberships = useAuthStore((state) => state.memberships);
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);

  const [isSwitching, setIsSwitching] = useState(false);
  // Guards against a second switch firing while the first is in flight, which
  // React 18's double-invoked effects in development would otherwise cause.
  const switchAttempted = useRef<string | null>(null);

  const membership = memberships.find((m) => m.organizationId === orgId);

  // ── Guard: authenticated, and a member of THIS workspace ─────────────────
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (memberships.length === 0) {
      router.replace('/onboarding');
      return;
    }
    if (!membership) {
      // Authenticated, but not a member of the workspace in the URL. Send them
      // to one they do belong to rather than showing an error page.
      router.replace(`/workspace/${memberships[0].organizationId}`);
    }
  }, [isInitialized, user, memberships, membership, router]);

  // ── Reconcile: make the token match the URL ──────────────────────────────
  useEffect(() => {
    if (!membership || activeOrganizationId === orgId || switchAttempted.current === orgId) {
      return;
    }

    switchAttempted.current = orgId;
    setIsSwitching(true);

    authApi
      .switchWorkspace(orgId)
      .then((organization) => {
        setActiveOrganization(organization.id, organization.accessToken);
      })
      .catch(() => {
        // Access was revoked between loading the session and opening the link.
        router.replace('/onboarding');
      })
      .finally(() => setIsSwitching(false));
  }, [membership, activeOrganizationId, orgId, setActiveOrganization, router]);

  const isReady = isInitialized && user && membership && activeOrganizationId === orgId;

  if (!isReady || isSwitching) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar orgId={orgId} />

      <SidebarInset className="h-svh overflow-hidden">
        <header className="hidden h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:flex">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <WorkspaceBreadcrumb orgId={orgId} orgName={membership.organizationName} />
            </div>

            <div className="flex items-center gap-5">
              <LiveClock />
              {/* Notification sheet goes here — deferred. */}
            </div>
          </div>
        </header>

        <div className="scrollbar-pill flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-28 md:pb-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
