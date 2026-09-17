import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrentUserProvider } from '@/features/auth/current-user';
import { requireUser } from '@/features/auth/session';

/**
 * Workspace shell: the dashboard-01 layout with the sidebar-07 sidebar.
 *
 * <p>`variant="inset"` puts the page on a rounded panel beside the sidebar;
 * `collapsible="icon"` (in AppSidebar) folds the sidebar down to an icon rail.
 * The open/collapsed choice is saved in the `sidebar_state` cookie by the
 * sidebar itself and read back here, so a refresh doesn't pop it open again.
 *
 * <p>Resolves the signed-in user on the server and hands it to Client
 * Components through `useCurrentUser()`. This is not where access is enforced:
 * layouts don't re-run on client-side navigation. `proxy.ts` gates every
 * request, and RLS gates every row.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <CurrentUserProvider user={user}>
      {/* Instant labels on the collapsed icon rail. */}
      <TooltipProvider>
        <SidebarProvider
          defaultOpen={sidebarOpen}
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              // Wider than the 3rem default so the 40px nav buttons and the
              // 44px avatar fit, centred, when the sidebar is collapsed.
              '--sidebar-width-icon': 'calc(var(--spacing) * 16)',
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          {/* Pale mint panel, so the white cards and search stand out on it. */}
          <SidebarInset className="bg-canvas dark:bg-neutral-950">
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </CurrentUserProvider>
  );
}
