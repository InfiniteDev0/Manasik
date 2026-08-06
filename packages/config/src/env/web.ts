import { z } from 'zod';

// ─────────────────────────────────────────────
// Frontend environment
// ─────────────────────────────────────────────
//
// Only `NEXT_PUBLIC_*` belongs here. Everything in this file is inlined into
// the JS bundle and shipped to the browser — never put a secret in it.
//
// Server-only secrets (Resend keys, DB URLs, JWT secrets) live in the Spring
// API's own environment and are never read by Next.js.
//
// Next replaces `process.env.NEXT_PUBLIC_X` at build time via literal string
// substitution, so each variable must be written out in full below. Dynamic
// access like `process.env[key]` silently yields undefined.

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL, e.g. http://localhost:4000/v1'),

  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    .default('http://localhost:3000'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

const parsed = webEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  const issues = parsed.error.flatten().fieldErrors;
  console.error('\n[@manasik/config] Invalid environment variables in apps/web/.env.local:');
  for (const [key, msgs] of Object.entries(issues)) {
    console.error(`  - ${key}: ${(msgs ?? []).join(', ')}`);
  }
  throw new Error('Environment validation failed. Fix apps/web/.env.local and restart.');
}

export const env: WebEnv = parsed.data;
