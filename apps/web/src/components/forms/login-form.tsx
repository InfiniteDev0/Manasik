'use client';

import { cn } from '@/lib/utils';
import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { gooeyToast } from 'goey-toast';
import type { ComponentPropsWithoutRef } from 'react';
import { signIn, type SignInState } from '@/features/auth/actions';

interface LoginFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'action'> {
  className?: string;
  /** Where to land after signing in. Validated again on the server. */
  next?: string;
  /** Switches the surrounding page to the signup form. */
  onSwitchMode?: () => void;
}

const inputClass =
  'h-12 w-full rounded-lg bg-muted px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none  transition focus-visible:ring-1 focus-visible:ring-ring';

const initialState: SignInState = { error: null, email: '', redirectTo: null };

/** Minimum time "Signing in…" shows, so a fast sign-in doesn't just flash it. */
const MIN_LOADING_MS = 800;

/** How long the expanded "Signed in" / "Couldn't sign in" toast stays up. goey-toast's default is 4000. */
const TOAST_DISPLAY_MS = 6000;

export function LoginForm({ className, next, onSwitchMode, ...props }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (previous: SignInState, formData: FormData): Promise<SignInState> => {
      const attempt = Promise.all([
        // A dropped connection rejects; fold it into the same shape as any
        // other failure so the toast and the form handle both the same way.
        signIn(previous, formData).catch(
          (): SignInState => ({
            error: 'Could not reach the server. Check your connection.',
            email: String(formData.get('email') ?? ''),
            redirectTo: null,
          }),
        ),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]).then(([result]) => result);

      // Promise toast: "Signing in…" morphs into an expanded success or error.
      gooeyToast.promise(
        attempt.then((result) => {
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        }),
        {
          loading: 'Signing in…',
          success: 'Signed in',
          error: 'Couldn’t sign in',
          description: {
            success: 'Welcome back to Manasik.',
            error: (error) => (error instanceof Error ? error.message : 'Try again.'),
          },
          timing: { displayDuration: TOAST_DISPLAY_MS },
        },
      );

      const result = await attempt;
      if (result.redirectTo) {
        // The toaster lives in the root layout, so the toast keeps playing
        // on the dashboard.
        router.replace(result.redirectTo);
      }
      return result;
    },
    initialState,
  );

  // Stay busy through the navigation, not just the request.
  const isBusy = isPending || Boolean(state.redirectTo);

  return (
    <form action={formAction} className={cn('w-full max-w-md', className)} {...props}>
      <h1 className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight">
        Log in
      </h1>

      {next ? <input type="hidden" name="next" value={next} /> : null}

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
            // Uncontrolled: React resets the form after each action, and this
            // puts the email back while the password stays cleared.
            defaultValue={state.email}
            disabled={isBusy}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Password"
              className={cn(inputClass, 'pr-12')}
              disabled={isBusy}
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
        disabled={isBusy}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isBusy ? (
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
