'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import type { ComponentPropsWithoutRef } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface SignupFormProps extends ComponentPropsWithoutRef<'form'> {
  className?: string;
}

// 5 checks to match backend Zod password schema exactly
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

export function SignupForm({ className, ...props }: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: React.ReactNode;
  }>({});

  const strength = calcStrength(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

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
      await apiFetch<{ message: string }>('/auth/register', {
        method: 'POST',
        body: { name: name || undefined, email, password },
      });
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setErrors({
            general: (
              <>
                An account with this email already exists.{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth')}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Log in instead
                </button>
              </>
            ),
          });
        } else if (err.statusCode === 422) {
          setErrors({ general: err.message || 'Validation failed' });
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <Toaster position="top-center" theme="dark" richColors />
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Get started with Lenzro in less than 2 minutes
          </p>
        </div>

        {errors.general && (
          <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-sm">
            {errors.general}
          </div>
        )}

        {/* Name (optional) */}
        <Field>
          <FieldLabel htmlFor="name" className="text-xs">
            Full name (optional)
          </FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email" className="text-xs">
            Business Email
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="business@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        {/* Password + strength bars */}
        <Field>
          <FieldLabel htmlFor="password" className="text-xs">
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="******"
              autoComplete="new-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded',
                      i < strength.bars
                        ? BAR_COLORS[strength.bars - 1]
                        : 'bg-zinc-700',
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </Field>

        {/* Confirm password */}
        <Field>
          <FieldLabel htmlFor="confirmPassword" className="text-xs">
            Confirm password
          </FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              placeholder="******"
              autoComplete="new-password"
              className="pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </Field>

        {/* Create account button */}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={16} />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </Field>

        <FieldSeparator className="bg-transparent">Or continue with</FieldSeparator>

        {/* Google */}
        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
            }}
            className="flex gap-2 items-center"
          >
            <svg className="size-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C36.45 2.7 30.7 0 24 0 14.82 0 6.73 5.8 2.7 14.1l7.98 6.2C12.1 13.7 17.6 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9.02h12.4c-.54 2.9-2.18 5.36-4.65 7.04l7.2 5.6C43.7 37.1 46.1 31.3 46.1 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.68 28.3c-1.1-3.2-1.1-6.7 0-9.9l-7.98-6.2C.9 16.1 0 20.2 0 24.5c0 4.3.9 8.4 2.7 12.3l7.98-6.2z"
                />
                <path
                  fill="#EA4335"
                  d="M24 48c6.48 0 11.92-2.14 15.9-5.8l-7.2-5.6c-2.02 1.36-4.6 2.16-8.7 2.16-6.4 0-11.9-4.2-13.9-10.1l-7.98 6.2C6.73 42.2 14.82 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </g>
            </svg>
            Sign up with Google
          </Button>

          <FieldDescription className="text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Log in
            </button>
          </FieldDescription>

          <p className="text-xs text-muted-foreground text-center mt-2">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </Field>
      </FieldGroup>
    </form>
  );
}
