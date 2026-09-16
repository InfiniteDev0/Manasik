'use client';

import { cn } from '@/lib/utils';
import { useActionState, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { ComponentPropsWithoutRef } from 'react';
import { signIn, type SignInState } from '@/features/auth/actions';

interface LoginFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'action'> {
  className?: string;
  /** Where to land after signing in. Validated again on the server. */
  next?: string;
}

const inputClass =
  'h-12 w-full rounded-lg bg-muted px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none  transition focus-visible:ring-1 focus-visible:ring-ring';

const initialState: SignInState = { error: null, email: '' };

export function LoginForm({ className, next, ...props }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  // Success redirects on the server, so the only state that ever comes back
  // is a failure. A new state object per attempt re-fires the toast even when
  // the message is the same.
  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

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
            disabled={isPending}
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
              disabled={isPending}
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
        disabled={isPending}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader className="animate-spin" size={16} />
            Logging in...
          </>
        ) : (
          'Log in'
        )}
      </button>
    </form>
  );
}
