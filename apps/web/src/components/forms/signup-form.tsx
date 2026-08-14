'use client';

import { cn } from '@/lib/utils';
// NOTE: re-add `import { GoogleIcon } from '@/components/ui/google-icon'` when
// the OAuth button below is uncommented.
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { Eye, EyeOff, Loader } from 'lucide-react';
import type { ComponentPropsWithoutRef, SubmitEvent } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// UI SKELETON ONLY — submits nowhere. Wiring is ROADMAP Phase 6.
//
// Collects email + password up front, which matches the backend plan
// (POST /v1/auth/register takes a password directly).
// ─────────────────────────────────────────────────────────────────────────────

interface SignupFormProps extends Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> {
  className?: string;
  /** Switches the surrounding page to the login form. */
  onSwitchMode?: () => void;
}

const inputClass =
  'h-12 w-full rounded-lg bg-muted px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition focus-visible:ring-1 focus-visible:ring-ring';

// 5 checks, mirroring `passwordSchema` in @manasik/validations. If that schema
// changes, change this too — the API re-validates regardless, so a mismatch
// here just means the meter lies to the user.
function calcStrength(p: string): { score: number; label: string; bars: number } {
  if (!p) {
    return { score: 0, label: '', bars: 0 };
  }
  let score = 0;
  if (p.length >= 8) {
    score++;
  }
  if (/[A-Z]/.test(p)) {
    score++;
  }
  if (/[a-z]/.test(p)) {
    score++;
  }
  if (/[0-9]/.test(p)) {
    score++;
  }
  if (/[^A-Za-z0-9]/.test(p)) {
    score++;
  }
  switch (score) {
    case 5:
      return { score, label: 'Very strong', bars: 4 };
    case 4:
      return { score, label: 'Strong', bars: 3 };
    case 3:
      return { score, label: 'Fair', bars: 2 };
    case 2:
      return { score, label: 'Weak', bars: 1 };
    case 1:
      return { score, label: 'Too weak', bars: 1 };
    default:
      return { score, label: 'Too weak', bars: 0 };
  }
}

const BAR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm({ className, onSwitchMode, ...props }: SignupFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const strength = calcStrength(password);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Client-side checks first — instant feedback, no round-trip. The API
    // re-validates everything regardless; this is UX, not enforcement.
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    if (strength.score < 5) {
      setErrors({
        password:
          'Password needs 8+ characters with uppercase, lowercase, number, and special character',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({ fullName, email, password, acceptTerms: true });
      // No session yet: the account is unverified and cannot log in until the
      // emailed code is entered.
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        // Map the API's per-field messages onto the matching inputs rather
        // than showing one generic banner.
        if (error.fieldErrors) {
          setErrors(error.fieldErrors as FieldErrors);
        } else if (error.status === 409) {
          setErrors({ email: 'An account with this email already exists' });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Could not reach the server. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full max-w-md', className)} {...props}>
      <h1 className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight">
        Sign up
      </h1>

      <div className="mt-8 space-y-4">
        {/* Full name — required by the API and by the product spec */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm text-muted-foreground">
            Full name
          </label>
          <input
            id="signup-name"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Ahmed Mohamed"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm text-muted-foreground">
            Work email
          </label>
          <input
            id="signup-email"
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
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Password + strength meter */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
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

          {password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < strength.bars ? BAR_COLORS[strength.bars - 1] : 'bg-border',
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="signup-confirm" className="text-sm text-muted-foreground">
            Confirm password
          </label>
          <input
            id="signup-confirm"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Confirm password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Terms — the API rejects registration unless this is true */}
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
        />
        <span>
          I agree to Manasik&apos;s{' '}
          <Link href="/terms" className="text-foreground underline underline-offset-4">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        // Disabled until terms are accepted: the API would reject it anyway,
        // and a rejected submit is a worse experience than an obvious blocker.
        disabled={isLoading || !acceptTerms}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin" size={16} />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </button>

      {/* Divider */}
      {/* <div className="my-5 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div> */}

      {/* Federated — inert until OAuth lands ("Later" in the tech stack).
      <button
        type="button"
        disabled
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-[15px] font-medium text-foreground transition hover:bg-muted/60 disabled:opacity-50"
      >
        <GoogleIcon className="size-4.5" />
        Continue with Google
      </button> */}

      {/* Terms notice hidden for vertical space. Re-enable before launch —
          `acceptTerms` is a required field on registerSchema, and agreeing to
          terms needs to be visible at the point of consent, not buried.
          NOTE: re-add `import Link from 'next/link'` when restoring.

      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        By clicking &ldquo;Create account&rdquo; above, you acknowledge that you have
        read, understood, and agree to Manasik&apos;s{' '}
        <Link href="/terms" className="text-foreground underline underline-offset-4">
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-foreground underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p> */}

      <div className="mt-5 flex items-center justify-between gap-4">
        <span className="text-[15px] text-foreground">Already have an account?</span>
        <button
          type="button"
          onClick={onSwitchMode}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-muted/60"
        >
          Log in
        </button>
      </div>
    </form>
  );
}
