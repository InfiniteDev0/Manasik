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
import type { User } from '@manasik/types';
import { apiFetch, ApiError } from '@/lib/api';
import { setSessionHint } from '@/lib/auth-cookie';
import { useAuthStore } from '@/lib/store';

interface LoginFormProps extends ComponentPropsWithoutRef<'form'> {
  className?: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string; user: User }>(
        '/auth/login',
        {
          method: 'POST',
          body: { email, password },
          onTokenRefreshed: (t) => useAuthStore.getState().setToken(t),
          onRefreshFailed: () => router.push('/auth'),
        },
      );

      useAuthStore.getState().setAuth(data.user, data.accessToken);

      // Smart redirect: existing workspace if any, onboarding if none
      try {
        const wsResult = await apiFetch<{ workspaces: { slug: string }[] }>(
          '/workspaces/me',
          {
            token: data.accessToken,
            onTokenRefreshed: (t) => useAuthStore.getState().setToken(t),
            onRefreshFailed: () => router.push('/auth'),
          },
        );
        if (wsResult.workspaces.length > 0) {
          setSessionHint(wsResult.workspaces[0].slug);
          router.push(`/workspace/${wsResult.workspaces[0].slug}`);
        } else {
          setSessionHint();
          router.push('/onboarding');
        }
      } catch {
        // If /workspaces/me fails, default to onboarding (safer than blank screen)
        setSessionHint();
        router.push('/onboarding');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          toast.error('Invalid email or password');
        } else if (err.statusCode === 403) {
          toast.error('Please verify your email first');
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
          <h1 className="text-2xl ">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your business email below and login
          </p>
        </div>

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

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-xs">
              Password
            </FieldLabel>
            <Link href="#" className="ml-auto text-xs underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="******"
              autoComplete="current-password"
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
        </Field>

        {/* Login button */}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={16} />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </Field>

        {/* Separator */}
        <FieldSeparator className="bg-transparent">Or continue with</FieldSeparator>

        {/* Google login */}
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
            Sign in with Google
          </Button>

          <FieldDescription className="text-center">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth?mode=signup')}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Sign up
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
