The Render logs prove this — 04:30:23 is when the container started booting from completely cold. Everything after that was fast (6 seconds to boot, 93ms to respond). The 5 minutes was Render's infrastructure waking up the container itself, before your app even started.

The fix — two parts
Part 1 — The real fix (do this)
Upgrade Render to the Starter plan ($7/month)
This keeps your service always running
Zero cold starts
This is non-negotiable for a production SaaS
Users will not wait 5 minutes on first visit, ever
Go to Render → your lenzro-api service → Settings → Instance Type → change from Free to Starter ($7/mo).

Part 2 — The safety net (do this regardless)
Even on a paid plan, deploys cause brief restarts. AuthProvider should never hang silently forever. Add a timeout + retry UI.
Tell Claude in your IDE:

"In apps/web/src/components/providers/auth-provider.tsx, add a timeout to the initial auth check. Show diff before writing.
Add a new state: const [timedOut, setTimedOut] = useState(false)
In the useEffect, before the try block, start a timeout:
typescriptconst timeoutId = setTimeout(() => {
  if (!cancelled) setTimedOut(true)
}, 8000) // 8 seconds
Clear this timeout in all success/failure paths (wherever setInitialized is called) and in the cleanup function.
If timedOut is true AND !isInitialized, render this instead of the spinner:
tsx<div className='flex min-h-screen items-center justify-center bg-background flex-col gap-4'>
  <Loader className='animate-spin' size={20} />
  <p className='text-sm text-zinc-500'>Waking up the server, this can take a moment...</p>
  <button
    onClick={() => window.location.reload()}
    className='text-xs text-zinc-400 underline'
  >
    Retry
  </button>
</div>
Show diff before writing."


Do Part 1 right now
That $7/month upgrade is the actual fix. Go do it now, then test on a new device again — it should load in under 1 second.