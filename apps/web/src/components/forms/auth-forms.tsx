'use client';

import { LoginForm } from '@/components/forms/login-form';
import { SignupForm } from '@/components/forms/signup-form';

export type AuthMode = 'login' | 'signup';

interface AuthFormsProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
}

/** Swaps the two auth forms in place. The surrounding layout never changes. */
export function AuthForms({ mode, setMode }: AuthFormsProps) {
  return mode === 'signup' ? (
    <SignupForm onSwitchMode={() => setMode('login')} />
  ) : (
    <LoginForm onSwitchMode={() => setMode('signup')} />
  );
}
