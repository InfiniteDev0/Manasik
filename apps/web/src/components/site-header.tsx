"use client"

import { PlusIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { HeaderClock } from "@/components/header-clock"
import { HeaderSearch } from "@/components/header-search"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useCurrentUser } from "@/features/auth/current-user"
import { pageTitle } from "@/features/workspace/navigation"

function greeting(hour: number) {
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

/**
 * Workspace header: page title and greeting on the left, search and the main
 * call to action on the right. On narrow screens the search drops to its own
 * full-width row.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const user = useCurrentUser()

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-black/5 px-4 dark:border-white/10 py-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
          {pageTitle(pathname)}
        </h1>
      </div>
{/* 
      <HeaderSearch className="order-last w-full md:order-none md:w-80 lg:w-[28rem]" />

      <Button className="h-12 gap-2 rounded-xl bg-vivid-cyan px-5 text-base font-medium text-white hover:bg-vivid-cyan/90">
        <PlusIcon className="size-5" />
        Create New Tour
      </Button> */}

      <HeaderClock className="hidden md:inline" />
    </header>
  )
}
