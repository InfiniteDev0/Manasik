import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import { AUTH_ENABLED } from './config';
import type { SessionUser } from './types';

/** Who the app thinks you are while auth is switched off. */
const PLACEHOLDER_USER: SessionUser = {
  id: 'local-admin',
  email: 'admin@manasik.local',
  fullName: 'Admin',
};

/**
 * The signed-in user, or null.
 *
 * <p>Wrapped in `cache` so a layout and a page asking in the same render
 * verify the token once, not twice.
 *
 * <p>`getClaims` checks the JWT's signature and expiry. With Supabase's
 * asymmetric signing keys (the default on new projects) that happens locally,
 * with no round trip to the Auth server on every page.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!AUTH_ENABLED) {
    return PLACEHOLDER_USER;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  const { sub, email = '', user_metadata: metadata } = data.claims;
  const fullName =
    typeof metadata?.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : email.split('@')[0];

  return { id: sub, email, fullName };
});

/** Like `getCurrentUser`, but sends a signed-out visitor to `/auth`. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth');
  }
  return user;
}
