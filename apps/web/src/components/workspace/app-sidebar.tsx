'use client';

import type * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { hasPermission } from '@manasik/types';
import { NavUser } from '@/components/nav-user';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { WORKSPACE_NAV_ITEMS, navItemUrl, workspaceBase } from '@/features/workspace/nav-items';
import { useAuthStore } from '@/lib/store/auth.store';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgId: string;
}

export function AppSidebar({ orgId, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const memberships = useAuthStore((state) => state.memberships);

  const role = memberships.find((m) => m.organizationId === orgId)?.role ?? null;
  const base = workspaceBase(orgId);

  // Hide entries the role cannot use. This is presentation only — the API
  // enforces the real rule — but showing a link that only ever 403s is a worse
  // experience than not showing it.
  const items = WORKSPACE_NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(role, item.permission),
  ).map((item) => ({ ...item, url: navItemUrl(base, item) }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              // The home entry must match exactly, or it would light up on
              // every child route since they all start with the base path.
              const active =
                item.url === base ? pathname === base : pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={active}
                    render={<Link href={item.url} />}
                    // Collapsed to icons, a 10%-opacity tint is invisible at
                    // that size — hence the solid swap in the icon variant.
                    className="mb-1 text-muted-foreground data-active:bg-green-500/10 data-active:font-medium data-active:text-foreground group-data-[collapsible=icon]:data-active:bg-black group-data-[collapsible=icon]:data-active:text-white"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>

                  {active && (
                    // Shared layoutId makes the bar slide between items rather
                    // than blink out and in.
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-emerald-500 group-data-[collapsible=icon]:hidden"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? '',
            email: user?.email ?? '',
            avatar: user?.avatarUrl ?? '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
