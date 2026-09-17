'use client';

import { useSyncExternalStore } from 'react';

import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from './theme-script';

type ResolvedTheme = 'light' | 'dark';

const listeners = new Set<() => void>();

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Storage blocked (private mode, disabled site data): fall back quietly.
    return DEFAULT_THEME;
  }
}

function readResolvedTheme(): ResolvedTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Mirrors THEME_INIT_SCRIPT in theme-script.ts. */
function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  // "System" follows the OS live, e.g. when it switches to dark at sunset.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (readTheme() === 'system') {
      applyTheme('system');
      notify();
    }
  };

  // A change made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(readTheme());
      notify();
    }
  };

  media.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Can't persist — still switch for this page view.
  }
  applyTheme(theme);
  notify();
}

/**
 * The chosen theme (`light` / `dark` / `system`) and what's actually showing
 * (`light` / `dark`). The server renders light; the browser corrects on hydration.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    readResolvedTheme,
    (): ResolvedTheme => 'light',
  );

  return { theme, resolvedTheme, setTheme };
}
