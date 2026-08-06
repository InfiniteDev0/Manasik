// ─────────────────────────────────────────────
// Shared constants — FRONTEND ONLY
// ─────────────────────────────────────────────
//
// The API is Spring Boot (Java) and cannot import this package. Anything here
// that the backend also needs is duplicated in `apps/api/src/main/resources/
// application.yml`. Keep the two in sync by hand — there is no build-time link.
//
// Rule of thumb: if the browser doesn't need it, it does not belong here.

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/${API_VERSION}` as const;

// Refresh token cookie. Set by the API, never read by JS (HttpOnly) — the name
// is here so the frontend can reason about the auth surface, not touch it.
export const REFRESH_COOKIE_NAME = 'manasik_rt' as const;
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth` as const;

// Access token lifetime. The frontend uses this to schedule a silent refresh
// slightly before expiry rather than waiting for a 401.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

// Refresh this many seconds before the access token actually expires, so an
// in-flight request never races the expiry.
export const ACCESS_TOKEN_REFRESH_SKEW_SECONDS = 60;

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

// ─────────────────────────────────────────────
// OTP
// ─────────────────────────────────────────────

export const OTP_LENGTH = 6 as const;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
