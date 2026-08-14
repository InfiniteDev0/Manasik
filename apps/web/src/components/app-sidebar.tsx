"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BuildingIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PackageIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"

/**
 * Navigation for an agency workspace.
 *
 * <p>Sourced from `docs/manasik.md`'s sidebar spec. Every destination is `#`
 * for now — the routes do not exist yet, and linking to a 404 is worse than an
 * obvious placeholder.
 *
 * <p>TODO: filter these by permission. An OPERATIONS user should not see
 * Payments, and a GUIDE should see only their groups. `hasPermission` from
 * `@manasik/types` already encodes the rules; the server enforces them
 * regardless, so this is about not showing dead ends.
 */
const NAV_MAIN = [
  {
    title: "Dashboard",
    url: "#",
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [],
  },
  {
    title: "Pilgrims",
    url: "#",
    icon: <UsersIcon />,
    items: [
      { title: "All pilgrims", url: "#" },
      { title: "Groups", url: "#" },
      { title: "Documents", url: "#" },
    ],
  },
  {
    title: "Packages",
    url: "#",
    icon: <PackageIcon />,
    items: [
      { title: "All packages", url: "#" },
      { title: "Bookings", url: "#" },
    ],
  },
  {
    title: "Operations",
    url: "#",
    icon: <BuildingIcon />,
    items: [
      { title: "Hotels", url: "#" },
      { title: "Transport", url: "#" },
      { title: "Flights", url: "#" },
      { title: "Guides", url: "#" },
    ],
  },
  {
    title: "Finance",
    url: "#",
    icon: <CreditCardIcon />,
    items: [
      { title: "Payments", url: "#" },
      { title: "Invoices", url: "#" },
      { title: "Reports", url: "#" },
    ],
  },
  {
    title: "Calendar",
    url: "#",
    icon: <CalendarDaysIcon />,
    items: [],
  },
  {
    title: "Tasks",
    url: "#",
    icon: <FileTextIcon />,
    items: [],
  },
  {
    title: "Settings",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      { title: "Workspace", url: "#" },
      { title: "Team", url: "#" },
      { title: "Billing", url: "#" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Reads memberships from the store itself and calls the API to switch,
            since switching means reissuing the token — not just navigating. */}
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_MAIN} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            avatar: user?.avatarUrl ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
