'use client';

import { useEffect, useRef, useState } from 'react';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { Button } from '@/components/ui/button';

interface CreatingWorkspaceProps {
  workspaceName: string;
  onComplete: (slug: string) => void;
  submitWorkspace: () => Promise<void>;
  workspaceSlug: string | null;
}

const CHECKLIST = [
  'Creating your workspace',
  'Installing your tools',
  'Setting up your Blackboard',
  'Preparing your inbox',
  'Almost ready',
];

const TICK_MS = 1500;

// Loader step shape expected by MultiStepLoader
const LOADING_STATES = CHECKLIST.map((text) => ({ text }));

export function CreatingWorkspace({
  workspaceName,
  onComplete,
  submitWorkspace,
  workspaceSlug,
}: CreatingWorkspaceProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const [apiDone, setApiDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Strict-Mode guard: stop submitWorkspace from firing twice on dev double-mount
  const submittedRef = useRef(false);

  useEffect(() => {
    // ── Loader animation: steps through all states once, then we're "done" ──
    const animTimer = setTimeout(
      () => setAnimationDone(true),
      LOADING_STATES.length * TICK_MS,
    );

    // ── API call (once only) ───────────────────────────────
    if (!submittedRef.current) {
      submittedRef.current = true;
      submitWorkspace()
        .then(() => {
          setApiDone(true);
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Something went wrong';
          setApiError(message);
        });
    }

    return () => clearTimeout(animTimer);
  }, [submitWorkspace]);

  // Derived: show "complete" UI only when both timer and API are done AND no error
  const showComplete = apiDone && animationDone && !apiError;

  // ── Error state ──────────────────────────────────────────
  if (apiError) {
    return (
      <div className="min-h-screen bg-accent flex flex-col items-center justify-center px-4">
        <img
          src="/images/failed.svg"
          alt=""
          className="size-12 object-contain mb-4"
        />
        <h2 className="text-xl font-semibold text-white">
          Something went wrong
        </h2>
        <p className="text-sm text-zinc-500 mt-2 text-center max-w-sm">
          {apiError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Normal state: multi-step loader while creating → complete card ─
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Fullscreen multi-step loader — runs until both the API and the
          loader animation have finished. */}
      <MultiStepLoader
        loadingStates={LOADING_STATES}
        loading={!showComplete}
        duration={TICK_MS}
        loop={false}
      />

      {showComplete && (
        <div className="flex flex-col items-center w-full max-w-xs">
          <img
            src="/images/rocket.svg"
            alt=""
            className="size-18 object-contain mb-4"
          />
          <h2 className="text-xl text-white text-center mt-6">
            Your workspace is ready
          </h2>
          <p className="text-zinc-500 text-sm text-center">
            {workspaceName}
          </p>
          <Button
            onClick={() => {
              if (workspaceSlug) {
                onComplete(workspaceSlug);
              }
            }}
            disabled={!workspaceSlug}
            className="mt-8 w-full max-w-xs  font-medium disabled:opacity-50"
          >
            Open your workspace
          </Button>
        </div>
      )}
    </div>
  );
}
