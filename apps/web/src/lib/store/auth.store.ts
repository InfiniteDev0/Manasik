import { create } from 'zustand';
import type { User } from '@manasik/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (user: User, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,

  setAuth: (user, accessToken) => set({ user, accessToken }),
  setToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: () => set({ isInitialized: true }),
}));
