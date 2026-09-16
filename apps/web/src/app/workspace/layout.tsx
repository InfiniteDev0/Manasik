import { AppSidebar } from '@/components/workspace/app-sidebar';
import { LiveClock } from '@/components/workspace/live-clock';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CurrentUserProvider } from '@/features/auth/current-user';
import { requireUser } from '@/features/auth/session';
import { WorkspaceBreadcrumb } from '@/features/workspace/workspace-breadcrumb';

/**
 * Workspace shell — sidebar + header, applied to every /workspace page.
 *
 * <p>The user is resolved here, on the server, and handed down through context.
 * This is not where access is enforced: layouts don't re-run on client-side
 * navigation. `proxy.ts` gates every request, and RLS gates every row.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <CurrentUserProvider user={user}>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset className="h-svh overflow-hidden">
          <header className="hidden h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:flex">
            <div className="flex w-full items-center justify-between gap-2 px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <WorkspaceBreadcrumb />
              </div>

              <div className="flex items-center gap-5">
                <LiveClock />
                {/* Notification sheet goes here — needs a notifications table
                    first. */}
              </div>
            </div>
          </header>

          <div className="scrollbar-pill flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-28 md:pb-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
