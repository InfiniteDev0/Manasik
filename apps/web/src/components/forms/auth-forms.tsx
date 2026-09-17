'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';

import { LoginForm } from '@/components/forms/login-form';
import { SignupForm } from '@/components/forms/signup-form';

export type AuthMode = 'login' | 'signup';

interface AuthFormsProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  /** Where to land after signing in. */
  next?: string;
}

/**
 * Swaps the two auth forms in place. The surrounding layout never changes.
 *
 * <p>`m-auto` centres the form while it fits and pins it to the top once it
 * doesn't, so a tall form scrolls instead of being clipped. (Centring with
 * `items-center` on the scroll container pushes the overflow off the top, where
 * it can't be scrolled to.)
 */
export function AuthForms({ mode, setMode, next }: AuthFormsProps) {
  return (
    // Honours the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
      {/* `initial={false}`: no animation on page load, only on switching. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          className="m-auto w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {mode === 'signup' ? (
            <SignupForm next={next} onSwitchMode={() => setMode('login')} />
          ) : (
            <LoginForm next={next} onSwitchMode={() => setMode('signup')} />
          )}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
