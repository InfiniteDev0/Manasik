'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
import type { ComponentPropsWithoutRef, SubmitEvent } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// UI SKELETON ONLY — submits nowhere. Wiring is ROADMAP Phase 6.
// ─────────────────────────────────────────────────────────────────────────────

interface LoginFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> {
  className?: string;
  /** Switches the surrounding page to the signup form. */
  onSwitchMode?: () => void;
}

const inputClass =
  'h-12 w-full rounded-lg bg-muted px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none  transition focus-visible:ring-1 focus-visible:ring-ring';

export function LoginForm({ className, onSwitchMode, ...props }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading] = useState(false);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO(Phase 6): POST /v1/auth/login → access token in memory → redirect.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full max-w-md', className)}
      {...props}
    >
      <h1 className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight">
        Log in
      </h1>

      <div className="mt-8 space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="user@company.com"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-foreground underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Password"
              className={cn(inputClass, 'pr-12')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin" size={16} />
            Logging in...
          </>
        ) : (
          'Log in'
        )}
      </button>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-[15px] text-foreground">Don&apos;t have an account?</span>
        <button
          type="button"
          onClick={onSwitchMode}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-muted/60"
        >
          Sign up for free
        </button>
      </div>
    </form>
  );
}
