'use client';

import { useEffect, type ReactNode } from 'react';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Restores the session on boot.
 *
 * <p>The access token is held in memory only, so a page refresh loses it. The
 * HttpOnly refresh cookie survives, and `/auth/me` triggers the api client's
 * 401 → refresh → retry path — which mints a new access token without the
 * cookie ever being readable by JavaScript.
 *
 * <p>Failure here is the normal case for a logged-out visitor, so it is not an
 * error: mark initialization complete and let route guards decide.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payload = await authApi.me();
        if (!cancelled) {
          // /auth/me returns no accessToken — the client already holds the one
          // the refresh produced.
          setSession({
            user: payload.user,
            accessToken: useAuthStore.getState().accessToken ?? '',
            memberships: payload.memberships,
            activeOrganizationId: payload.activeOrganizationId,
          });
        }
      } catch {
        if (!cancelled) {
          clear();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, clear]);

  return <>{children}</>;
}
