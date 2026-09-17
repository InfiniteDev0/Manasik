"use client"

import { SearchIcon } from "lucide-react"
import { useEffect, useRef, useSyncExternalStore } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

// Read once on the client; the server assumes Mac and hydration corrects it.
const subscribeNever = () => () => {}
const isMacClient = () => /Mac|iPhone|iPad/.test(navigator.userAgent)
const isMacServer = () => true

/**
 * Header search. Not wired to anything yet — there's no data to search.
 *
 * ⌘F / Ctrl+F jumps into it. Pressing it again while it's already focused
 * falls through to the browser's own find, so that isn't lost.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isMac = useSyncExternalStore(subscribeNever, isMacClient, isMacServer)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f"
      if (!isShortcut || document.activeElement === inputRef.current) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <InputGroup
      className={cn("h-14 rounded-2xl border-0 bg-white px-2", className)}
    >
      <InputGroupAddon>
        <SearchIcon className="size-5 text-neutral-900" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        aria-label="Search"
        placeholder="type here to search anything"
        className="text-[15px] placeholder:text-neutral-400"
      />
      <InputGroupAddon align="inline-end">
        <Kbd className="h-8 min-w-12 bg-neutral-100 px-2.5 text-sm text-neutral-900">
          {isMac ? "⌘F" : "Ctrl F"}
        </Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}
