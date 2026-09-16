import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_ENABLED } from '@/features/auth/config';
import { AFTER_SIGN_IN_PATH } from '@/features/auth/next-path';
import { redirectWithSession, updateSession } from '@/lib/supabase/proxy';

/**
 * Runs before every page request.
 *
 * <ol>
 *   <li>Refreshes the Supabase session, which is what keeps you signed in.</li>
 *   <li>Signed out → `/auth`, remembering the page you were heading to.</li>
 *   <li>Signed in and on `/auth` → straight back to the workspace.</li>
 * </ol>
 *
 * <p>This is the optimistic gate, not the only one. Pages read the user through
 * `features/auth/session.ts`, and once real tables exist, Postgres RLS is what
 * decides which rows come back.
 */
export async function proxy(request: NextRequest) {
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  const { response, isSignedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');

  if (!isSignedIn && !isAuthRoute) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = '/auth';
    signIn.search = '';
    if (pathname !== '/') {
      signIn.searchParams.set('next', `${pathname}${search}`);
    }
    return redirectWithSession(signIn, response);
  }

  if (isSignedIn && pathname === '/auth') {
    const workspace = request.nextUrl.clone();
    workspace.pathname = AFTER_SIGN_IN_PATH;
    workspace.search = '';
    return redirectWithSession(workspace, response);
  }

  return response;
}

export const config = {
  // Everything except Next internals and static files — those don't need a
  // session, and the auth page's own images must load while signed out.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
