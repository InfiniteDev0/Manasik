'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  currentStep: number;
  maxStep: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  /** Widen the content column (e.g. multi-column grids). Default is the narrow ~560px column. */
  wide?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  currentStep,
  maxStep,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLoading = false,
  showSkip = false,
  onSkip,
  wide = false,
  children,
}: OnboardingLayoutProps) {
  const showBack = !!onBack && currentStep > 1;
  // Side illustration only appears on the first two steps.
  const showSideImage = currentStep === 1 || currentStep === 2;

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-8 items-center justify-center rounded-md">
            <img
              src="https://1j8rp7fkdq62hja2.public.blob.vercel-storage.com/Plugin%20icon%20-%202%20%281%29.png"
              className="z-50 m-auto rounded-xl"
              alt="Lenzro"
            />
          </div>
          Lenzro.
        </Link>
        {/* ── Progress + step counter (grouped right) ────────── */}
        <div className="flex items-center gap-4">
          <Progress
            value={(currentStep / maxStep) * 100}
            className="w-40 bg-zinc-800 *:data-[slot=progress-indicator]:bg-white"
          />
          <span className="text-zinc-500 text-sm whitespace-nowrap">
            Step {currentStep} of {maxStep}
          </span>
        </div>
      </div>

      {/* ── Content (animated step swap) ───────────────────── */}
      <div className="relative flex-1 flex items-center justify-center px-4">
        {/* Side illustration — first two steps only */}
        {showSideImage && (
          <img
            src="/images/test.svg"
            alt=""
            className="pointer-events-none absolute left-10 top-1/2 hidden size-72 -translate-y-1/2 object-contain lg:block"
          />
        )}

        <div className={cn('w-full', wide ? 'max-w-3xl' : 'max-w-[560px]')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom button bar ──────────────────────────────── */}
      <div className="px-8 py-6 flex items-center justify-between">
        {/* Back — kept `invisible` (not hidden) so layout stays stable on step 1 */}
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className={cn('text-zinc-400 hover:text-white', !showBack && 'invisible')}
        >
          Back
        </Button>

        <div className="flex gap-3">
          {showSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="text-white hover:text-zinc-300"
            >
              Skip for now
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className={cn(
              'bg-white text-black font-medium   rounded-lg flex items-center gap-2 transition',
              (nextDisabled || isLoading) && 'opacity-40 cursor-not-allowed'
            )}
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
