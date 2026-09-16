import type { CookieOptionsWithName } from '@supabase/ssr';

/**
 * How the session cookies are written. Used by every Supabase client we create.
 *
 * <h2>HttpOnly</h2>
 *
 * The library default is `httpOnly: false` so a browser client can read the
 * session. Manasik never creates a browser client — every Supabase call runs in a
 * Server Component, Server Action, Route Handler or the proxy — so the tokens
 * are locked away from JavaScript entirely. An XSS bug can't read them.
 *
 * <p>If a client-side feature ever needs Supabase directly (Realtime is the
 * likely one), that is a deliberate trade-off to revisit, not a flag to flip.
 *
 * <h2>Staying signed in</h2>
 *
 * The access token is short-lived (1 hour by default); the refresh token is
 * not. `proxy.ts` swaps an expiring access token for a fresh one on the next
 * request, and the cookie itself lasts 400 days (the library default, and the
 * browser maximum). Net effect: sign in once per device, stay signed in until
 * you sign out or the session is revoked in Supabase.
 *
 * <h2>SameSite=Lax, not Strict</h2>
 *
 * Strict would drop the session when arriving from an outside link (an email,
 * a notification), making you look signed out. CSRF is already covered: Server
 * Actions only accept POSTs whose Origin matches the host.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  // Plain http://localhost in dev; HTTPS-only everywhere else.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} satisfies CookieOptionsWithName;
