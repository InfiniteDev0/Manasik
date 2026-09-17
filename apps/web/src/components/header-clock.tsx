"use client"

import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// A tiny ticking store. The server has no clock to show (its time and zone
// aren't the visitor's), so it renders nothing and the time appears once the
// page is running in the browser — no hydration mismatch, no mounted flag.
let currentTime: string | null = null

function subscribe(onChange: () => void) {
  const tick = () => {
    currentTime = formatTime(new Date())
    onChange()
  }
  tick()
  const interval = setInterval(tick, 1000)
  return () => clearInterval(interval)
}

const getSnapshot = () => currentTime
const getServerSnapshot = () => null

/** Live clock for the header, in a cyan → blue → purple gradient. */
export function HeaderClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!time) {
    return null
  }

  return (
    <p
      className={cn(
        // tabular-nums keeps the width steady as the seconds change.
        "bg-linear-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-3xl leading-none tracking-tight text-transparent tabular-nums select-none",
        "dark:from-pink-400 dark:via-rose-500 dark:to-red-600",
        className
      )}
    >
      {time}
    </p>
  )
}
