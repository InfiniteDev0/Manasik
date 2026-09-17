/*
 * Theme constants plus the tiny script that applies the saved theme before the
 * page paints. No "use client": the root layout (a Server Component) inlines
 * the script into <head>.
 *
 * Dark mode is class-based (`@custom-variant dark` in globals.css): the `dark`
 * class on <html> switches the theme tokens and every `dark:` utility.
 */

export type Theme = 'light' | 'dark' | 'system';

export const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

/** Light until someone picks otherwise — the app was designed light-first. */
export const DEFAULT_THEME: Theme = 'light';

export const THEME_STORAGE_KEY = 'manasik-theme';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/**
 * Runs while the HTML is still being parsed, before anything is drawn, so a
 * dark-mode visitor never sees a flash of the light theme. Kept in sync with
 * `applyTheme` in use-theme.ts.
 */
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === 'dark' || stored === 'system' ? stored : ${JSON.stringify(DEFAULT_THEME)};
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (error) {}
})();`;
