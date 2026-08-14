'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { SubmitEvent } from 'react';
import { ApiError } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/store/auth.store';

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const email = searchParams.get('email') ?? '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the code field on arrival — the user has just switched to their email
  // client and back, and typing is the only thing to do here.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Resend cooldown. The API also rate-limits resends to 3 per 15 minutes;
  // this keeps the user from discovering that as an error.
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = await authApi.verifyEmail({ email, code });
      setSession(payload);
      // Verification issues a session, and a brand-new user has no workspace —
      // so this always lands on onboarding unless they were invited into one.
      router.push(payload.activeOrganizationId ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    try {
      await authApi.resendVerification(email);
      toast.success('A new code is on its way.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not resend the code.');
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Image
          src="/mansiklogoblack.png"
          alt="Manasik"
          width={48}
          height={48}
          priority
          className="mb-8 h-12 w-auto dark:invert"
        />

        <h1 className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight">
          Check your email
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="text-foreground">{email || 'your email address'}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="code" className="text-sm text-muted-foreground">
            Verification code
          </label>
          <input
            ref={inputRef}
            id="code"
            name="code"
            // `inputMode` + `autoComplete="one-time-code"` let mobile keyboards
            // show digits and offer the code straight from the SMS/email.
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="000000"
            className="mt-1.5 h-14 w-full rounded-lg bg-muted text-center text-2xl tracking-[0.5em] text-foreground outline-none transition placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-ring"
            value={code}
            // Strip non-digits so a pasted "012 345" still works.
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={16} />
                Verifying...
              </>
            ) : (
              'Verify email'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">Didn&apos;t get it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground transition hover:bg-muted/60 disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  // useSearchParams requires a Suspense boundary, or the whole route is forced
  // to client-side rendering at build time.
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
