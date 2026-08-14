'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * The workspace shell.
 *
 * <p>Chrome is real (sidebar, workspace switcher, user menu, breadcrumb); the
 * panels are placeholders until the operational dashboard is built.
 */
export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const memberships = useAuthStore((state) => state.memberships);
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const activeWorkspace = memberships.find((m) => m.organizationId === activeOrganizationId);

  // Route guard. The `isInitialized` check matters: on a page refresh the
  // access token is briefly absent while the session is restored from the
  // HttpOnly cookie, and redirecting during that window would bounce a
  // perfectly logged-in user back to the login screen.
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    if (!user) {
      router.replace('/auth');
    } else if (!activeOrganizationId) {
      router.replace('/onboarding');
    }
  }, [isInitialized, user, activeOrganizationId, router]);

  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {activeWorkspace?.organizationName ?? 'Dashboard'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Welcome, {user.fullName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeWorkspace
                ? `${activeWorkspace.organizationName} · you are the ${activeWorkspace.role.toLowerCase()}`
                : 'Your workspace is ready.'}
            </p>
          </div>

          {/* Placeholders for the metric cards from the product spec:
              today's departures, pilgrims travelling, revenue this month. */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />
          </div>

          <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
