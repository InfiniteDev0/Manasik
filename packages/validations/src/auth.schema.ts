import { z } from 'zod';

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────
//
// Validated inside the sign-in Server Action before anything reaches Supabase.
// Deliberately loose on the password: this checks the shape of the request,
// not the password policy — Supabase Auth owns that.

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Must be a valid email address')
    .max(255, 'Email must be at most 255 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be at most 128 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
