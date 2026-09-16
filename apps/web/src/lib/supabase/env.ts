/**
 * Supabase connection settings.
 *
 * <p>Both values are public by design — the publishable key only identifies
 * the project, and Row Level Security is what actually guards the data. They
 * are still read lazily rather than at import time, so a missing value fails
 * the request that needs it with a clear message instead of crashing the build.
 *
 * <p>Next inlines `process.env.NEXT_PUBLIC_*` by literal substitution, so each
 * variable has to be written out in full — `process.env[key]` would be undefined.
 */
export function supabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Copy them from Supabase → Project Settings → API Keys into apps/web/.env.local and restart.',
    );
  }

  return { url, publishableKey };
}
