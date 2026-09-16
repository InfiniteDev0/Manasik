export const AFTER_SIGN_IN_PATH = '/workspace';

const PLACEHOLDER_ORIGIN = 'http://manasik.internal';

/**
 * Where to send someone after signing in, from an untrusted `?next=` value.
 *
 * <p>Only same-origin paths survive. Everything else — `https://evil.com`,
 * `//evil.com`, `/\evil.com`, paths with smuggled whitespace — falls back to
 * the workspace. Resolving against a placeholder origin and comparing origins
 * catches all of those at once, which a `startsWith('/')` check does not.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return AFTER_SIGN_IN_PATH;
  }

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname.startsWith('/auth')) {
      return AFTER_SIGN_IN_PATH;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return AFTER_SIGN_IN_PATH;
  }
}
