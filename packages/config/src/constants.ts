// ─────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────
//
// Rule of thumb: only values more than one package needs belong here.

// ─────────────────────────────────────────────
// Internationalization
// ─────────────────────────────────────────────

export const LOCALES = ['en', 'ar', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

// Locales that render right-to-left. Drives `dir` on <html> and the RTL
// variants in Tailwind.
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export const isRtlLocale = (locale: string): boolean =>
  RTL_LOCALES.includes(locale as Locale);
