'use server';

import { loginSchema } from '@manasik/validations';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { AUTH_ENABLED } from './config';
import { safeNextPath } from './next-path';

export interface SignInState {
  error: string | null;
  /** Echoed back so a failed attempt doesn't make you retype your email. */
  email: string;
  /** Set on success: where to go next, already checked to be same-origin. */
  redirectTo: string | null;
}

/**
 * Email + password sign-in.
 *
 * <p>Runs on the server, so the password goes straight from the form to
 * Supabase and the session comes back as HttpOnly cookies — no token is ever
 * handed to browser JavaScript.
 *
 * <p>Returns the destination rather than redirecting, so the login form can
 * finish its toast before it navigates.
 */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '');
  const redirectTo = safeNextPath(formData.get('next'));

  if (!AUTH_ENABLED) {
    return { error: null, email, redirectTo };
  }

  const parsed = loginSchema.safeParse({ email, password: formData.get('password') });

  if (!parsed.success) {
    return { error: 'Enter your email and password.', email, redirectTo: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: signInErrorMessage(error.code), email, redirectTo: null };
  }

  return { error: null, email, redirectTo };
}

/**
 * Signs out THIS device only.
 *
 * <p>Supabase's default is `global`, which would also sign out your phone when
 * you sign out on your laptop. Revoke every session from the Supabase
 * dashboard if a device is ever lost.
 */
export async function signOut(): Promise<void> {
  if (!AUTH_ENABLED) {
    redirect('/auth');
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/auth');
}

function signInErrorMessage(code: string | undefined): string {
  switch (code) {
    // Deliberately doesn't say which of the two was wrong.
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'This account has not been confirmed yet.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a few minutes and try again.';
    default:
      return 'Could not sign in. Try again.';
  }
}
