"use client"

import Image from "next/image"

/**
 * Top of the sidebar: just shows which app this is — not a button or link.
 * Open, the logo sits beside the name; on the collapsed rail only the logo
 * shows, centred.
 */
export function SidebarBrand() {
  return (
    <div className="flex h-14 items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <Image
        src="/manasiklogowhite.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0"
      />
      {/* The whole text block is removed on the rail, not just clipped: text
          that's still in the layout drags the centred logo off-centre. */}
      <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <h1 className="truncate text-xl leading-tight font-light">Manasik</h1>
        <span className="truncate text-xs text-sidebar-foreground/60">Travel agency OS</span>
      </div>
    </div>
  )
}
