'use client';

import type * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { NavUser } from '@/components/nav-user';
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
import { useCurrentUser } from '@/features/auth/current-user';
import { WORKSPACE_BASE, WORKSPACE_NAV_ITEMS, navItemUrl } from '@/features/workspace/nav-items';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useCurrentUser();

  const base = WORKSPACE_BASE;
  const items = WORKSPACE_NAV_ITEMS.map((item) => ({ ...item, url: navItemUrl(base, item) }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-accent" render={<Link href={base} />}>
              <div className="text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm bg-cyan-800">
                <img src="/manasiklogowhite.png" className="size-6" alt="" />
              </div>
              <span className="truncate font-medium">Manasik</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              // The home entry must match exactly, or it would light up on
              // every child route since they all start with the base path.
              const active =
                item.url === base ? pathname === base : pathname.startsWith(item.url);

              // Parked features render as a disabled row rather than a link.
              // Navigating to an empty page reads as a broken product; an
              // honest "Soon" reads as a roadmap.
              if (item.comingSoon) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={`${item.title} — coming soon`}
                      disabled
                      className="mb-1 cursor-not-allowed text-muted-foreground/50"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
                        Soon
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

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
        <NavUser user={{ name: user.fullName, email: user.email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
