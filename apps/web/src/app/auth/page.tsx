'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthForms, type AuthMode } from '@/components/forms/auth-forms';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile  → hero image with a CTA; the auth panel swipes in over it.
// Desktop → fixed 50/50 split. Image always on the left, forms always on the
//           right. Switching login/signup swaps the form, never the layout.
//
// The page is pinned to the viewport (`h-svh` + `overflow-hidden`). If a form
// ever grows taller than the screen, the form COLUMN scrolls, not the page —
// that's what was pushing the card off-screen before.
//
// UI SKELETON — the forms submit nowhere. Wiring is ROADMAP Phase 6.
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [started, setStarted] = useState(false);

  return (
    <>
      {/* ── Mobile: hero → swipe-in auth ─────────────────────────────────── */}
      <div className="relative h-svh overflow-hidden lg:hidden">
        {/* Hero panel */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-6 transition-transform duration-300 ease-out",
            started && "-translate-x-full",
          )}
        >
          <Image
            src="/authsideimage.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="200vw"
          />
          <div className="bg-linear-to-t absolute inset-0 from-black/80 via-black/20 to-black/10" />

          <div className="relative z-10 text-white">
            <Image
              src="/manasiklogowhite.png"
              alt="Manasik"
              width={44}
              height={44}
              priority
              className="mb-4 size-15"
            />
            <h1 className="text-8xl font-light tracking-tight">Manasik</h1>
            <p className="mt-2 text-sm text-white/80">
              The operating system for Hajj &amp; Umrah agencies.
            </p>

            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-6 h-12 w-full rounded-lg bg-white text-[15px] font-semibold text-black transition hover:bg-white/90"
            >
              Get started
            </button>
          </div>
        </div>

        {/* Auth panel */}
        <div
          className={cn(
            "bg-background absolute inset-0 flex translate-x-full flex-col gap-4 p-6 transition-transform duration-300 ease-out",
            started && "translate-x-0",
          )}
        >
          <button
            type="button"
            onClick={() => setStarted(false)}
            aria-label="Back"
            className="text-muted-foreground hover:bg-muted -ml-2 flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
            <AuthForms mode={mode} setMode={setMode} />
          </div>
        </div>
      </div>

      {/* ── Desktop: split screen, forms always visible ──────────────────── */}
      <div className="hidden lg:grid lg:h-svh lg:grid-cols-2 lg:gap-2 lg:overflow-hidden lg:p-2">
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src="/authsideimage.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="bg-linear-to-t absolute inset-0 from-black/70 to-transparent" />
          <div className="absolute inset-x-8 bottom-8 text-white">
            <h1 className="text-8xl font-light">Manasik</h1>
            <p className="text-md text-white/80">
              Pilgrims, packages, payments and groups — one workspace per agency.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 p-6 md:p-10">
          <div className="flex shrink-0 justify-end gap-2">
            <div className="flex items-center justify-between gap-2 font-medium">
              {/* <h1 className='md:text-2xl font-light'>Manasik</h1> */}
              <img src="/mansiklogoblack.png" alt="" className="size-18 dark:invert" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
            <AuthForms mode={mode} setMode={setMode} />
          </div>
        </div>
      </div>
    </>
  );
}
