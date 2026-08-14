import { create } from 'zustand';
import type { MembershipSummary, User } from '@manasik/types';
import { setAccessToken } from '@/lib/api';

/**
 * Auth state.
 *
 * <h2>The access token lives in memory only</h2>
 *
 * Deliberately not persisted to `localStorage` or a readable cookie. Anything
 * JS can read, an XSS payload can steal — and a stolen access token is a valid
 * session until it expires.
 *
 * The cost is that a page refresh loses it. That is what the HttpOnly refresh
 * cookie is for: on boot the app calls `/auth/refresh`, gets a new access
 * token, and the user stays logged in without the token ever being readable.
 *
 * So: refreshing the page is not a bug, it is the design.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  memberships: MembershipSummary[];
  activeOrganizationId: string | null;

  /** False until the initial refresh attempt has settled. */
  isInitialized: boolean;

  setSession: (payload: {
    user: User;
    accessToken: string;
    memberships: MembershipSummary[];
    activeOrganizationId: string | null;
  }) => void;
  setAccessToken: (token: string | null) => void;
  setActiveOrganization: (organizationId: string, accessToken: string) => void;
  clear: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  memberships: [],
  activeOrganizationId: null,
  isInitialized: false,

  setSession: ({ user, accessToken, memberships, activeOrganizationId }) => {
    // Keep the api module in step — it holds the token used for outgoing
    // requests, including the ones triggered by a background refresh.
    setAccessToken(accessToken);
    set({ user, accessToken, memberships, activeOrganizationId, isInitialized: true });
  },

  setAccessToken: (token) => {
    setAccessToken(token);
    set({ accessToken: token });
  },

  setActiveOrganization: (organizationId, accessToken) => {
    setAccessToken(accessToken);
    set({ activeOrganizationId: organizationId, accessToken });
  },

  clear: () => {
    setAccessToken(null);
    set({
      user: null,
      accessToken: null,
      memberships: [],
      activeOrganizationId: null,
      isInitialized: true,
    });
  },

  setInitialized: () => set({ isInitialized: true }),
}));

/** True once the user has a workspace; false means send them to onboarding. */
export const selectHasWorkspace = (state: AuthState): boolean =>
  state.activeOrganizationId !== null;
