"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

import { railTooltip } from "@/components/rail-tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { isActivePath, type NavItem } from "@/features/workspace/navigation"
import { maskStyle } from "@/lib/mask"

/* The icon image is used as a mask, not shown as-is, so its colour comes from
   state instead of the file's own baked-in gradient: grey at rest, yellow→pink
   on hover, yellow→green when active. `group/menu-button` is the class
   SidebarMenuButton already puts on every button; active wins over hover. */
function NavIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden
      style={maskStyle(src)}
      className="size-5 shrink-0 bg-sidebar-foreground/50 group-hover/menu-button:bg-[linear-gradient(135deg,#ffd600,#ff007a)] group-data-active/menu-button:bg-[linear-gradient(135deg,#ffd600,#00d078)]!"
    />
  )
}

// Bigger than the shadcn defaults (h-8, 14px text, 16px icons) so the links are
// easier to read. Collapsed, each button becomes a centred 40px square around
// the 20px icon — the workspace layout widens the icon rail (--sidebar-width-icon)
// to fit it and the 44px avatar.
const ITEM_CLASS = [
  "h-10 gap-3 px-3 text-[15px] [&_svg]:size-[18px]",
  "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-[10px]!",
  // Label: dimmed at rest, full strength on hover or when active.
  "text-sidebar-foreground/70 hover:text-sidebar-foreground data-active:text-sidebar-foreground",
  // Gray on hover; a brighter gray that stays put on the active tab.
  "data-active:bg-white/20 data-active:hover:bg-white/20",
].join(" ")

// An open Finance / Reports row whose sub-page is active: the sub-link carries
// the active box, so the row itself keeps its green icon but not a second box.
// (Collapsed to the rail the sub-links are hidden, so there it uses ITEM_CLASS.)
const GROUP_TRIGGER_CLASS = `${ITEM_CLASS} data-active:bg-transparent data-active:hover:bg-sidebar-accent`

const SUB_ITEM_CLASS =
  "h-9 px-3 text-[15px] text-sidebar-foreground/70 hover:text-sidebar-foreground data-active:text-sidebar-foreground data-active:font-medium data-active:bg-white/20 data-active:hover:bg-white/20"

export function NavMain({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  // Collapsed to icons: sub-pages can't show inline, so groups open a flyout.
  const isRail = state === "collapsed" && !isMobile

  return (
    <SidebarGroup className={className}>
      <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
        {items.map((item) => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={railTooltip(item.title)}
                  isActive={isActivePath(pathname, item.href)}
                  className={ITEM_CLASS}
                  render={<Link href={item.href} />}
                >
                  <NavIcon src={item.icon} />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          const groupActive = item.items.some((sub) => isActivePath(pathname, sub.href))

          if (isRail) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={railTooltip(item.title)}
                        isActive={groupActive}
                        className={ITEM_CLASS}
                      />
                    }
                  >
                    <NavIcon src={item.icon} />
                    <span>{item.title}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={14} className="min-w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                      {item.items.map((sub) => (
                        <DropdownMenuItem
                          key={sub.title}
                          className={isActivePath(pathname, sub.href) ? "font-medium" : undefined}
                          render={<Link href={sub.href} />}
                        >
                          {sub.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              // Opens on its own when you land on one of its pages.
              defaultOpen={groupActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    tooltip={railTooltip(item.title)}
                    isActive={groupActive}
                    className={GROUP_TRIGGER_CLASS}
                  />
                }
              >
                <NavIcon src={item.icon} />
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((sub) => (
                    <SidebarMenuSubItem key={sub.title}>
                      <SidebarMenuSubButton
                        isActive={isActivePath(pathname, sub.href)}
                        className={SUB_ITEM_CLASS}
                        render={<Link href={sub.href} />}
                      >
                        <span>{sub.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
