'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { SessionUser } from './types';

const CurrentUserContext = createContext<SessionUser | null>(null);

/**
 * Hands the signed-in user, resolved on the server by the workspace layout, to
 * the Client Components under it (sidebar, dashboard greeting, settings).
 */
export function CurrentUserProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): SessionUser {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used inside the workspace layout.');
  }
  return user;
}
