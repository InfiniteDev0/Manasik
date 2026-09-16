import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { AUTH_COOKIE_OPTIONS } from './cookies';
import { supabaseEnv } from './env';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * <p>Create one per request — never share it at module scope, or one visitor's
 * session could leak into another's.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. That is fine: proxy.ts has
          // already refreshed the session before this request reached here.
          // Server Actions and Route Handlers can write, so sign-in and
          // sign-out take the happy path.
        }
      },
    },
  });
}
