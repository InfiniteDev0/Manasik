"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SidebarBrand } from "@/components/sidebar-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/features/auth/current-user"
import { NAV_BOTTOM, NAV_MAIN } from "@/features/workspace/navigation"

// A black sidebar, expanded or collapsed. The sidebar's own colour tokens are
// re-pointed for this subtree only, so the page around it keeps the light theme
// and every `*-sidebar-*` utility inside follows along.
const BLACK_SIDEBAR_CLASS = [
  // The rounded inner panel (sidebar.tsx) is white by default; turn it black.
  "[&>[data-sidebar=sidebar]]:bg-black",
  "text-sidebar-foreground",
  "[--sidebar-foreground:oklch(0.985_0_0)]",
  "[--sidebar-accent:oklch(1_0_0/10%)]",
  "[--sidebar-accent-foreground:oklch(0.985_0_0)]",
  "[--sidebar-border:oklch(1_0_0/12%)]",
  "[--sidebar-ring:oklch(1_0_0/40%)]",
].join(" ")

/**
 * Sidebar from the sidebar-07 block: collapses to an icon rail
 * (`collapsible="icon"`) with a tooltip on every icon. The workspace layout
 * renders it with `variant="inset"` from dashboard-01, so the page sits on a
 * rounded panel.
 *
 * Navigation lives in features/workspace/navigation.ts; Settings is pinned to
 * the bottom, just above the user (and is in the user menu too).
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser()

  return (
    <Sidebar collapsible="icon" className={BLACK_SIDEBAR_CLASS} {...props}>
      {/* Breathing room between the brand and the nav items below it. */}
      <SidebarHeader className="pb-4">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_MAIN} />
        {/* mt-auto pushes Settings to the bottom, just above the user. */}
        <NavMain items={NAV_BOTTOM} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.fullName, email: user.email }} />
      </SidebarFooter>
    </Sidebar>
  )
}
