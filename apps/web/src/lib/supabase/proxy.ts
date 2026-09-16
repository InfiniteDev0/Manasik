import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_COOKIE_OPTIONS } from './cookies';
import { supabaseEnv } from './env';

/**
 * Refreshes the session for this request and reports who is signed in.
 *
 * <p>This is what keeps you signed in: when the access token is close to
 * expiring, `getClaims()` trades the refresh token for a new pair, and
 * `setAll` writes them onto both the request (so Server Components rendering
 * this same request see the fresh session) and the response (so the browser
 * stores it).
 *
 * <p>Always return — or copy cookies from — the `response` this gives back.
 * Building a fresh `NextResponse` instead drops the refreshed tokens, and the
 * browser and server drift apart until the session is lost.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // no-store headers: a CDN must never cache a response carrying
        // someone's session cookie.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nothing may run between creating the client and this call. `getClaims`
  // verifies the JWT signature — unlike `getSession`, which trusts whatever is
  // in the cookie.
  const { data } = await supabase.auth.getClaims();

  return { response, isSignedIn: Boolean(data?.claims.sub) };
}

/** A redirect that keeps any session cookies `updateSession` just refreshed. */
export function redirectWithSession(to: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = from.headers.get(header);
    if (value) {
      redirect.headers.set(header, value);
    }
  }
  return redirect;
}
