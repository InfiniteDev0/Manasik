import { z } from 'zod';

// ─────────────────────────────────────────────
// Shared rules
// ─────────────────────────────────────────────
//
// These drive the frontend forms. The Spring API re-validates every field with
// Jakarta Validation — never treat these as the enforcement layer. Keep the two
// in sync when a rule changes.

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Must be a valid email address')
  .max(255, 'Email must be at most 255 characters')
  .toLowerCase()
  .trim();

const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .trim();

const otpTokenSchema = z
  .string()
  .length(6, 'Code must be exactly 6 digits')
  .regex(/^[0-9]+$/, 'Code must contain digits only');

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
//
// Deliberately minimal. Registration creates a PERSON, not an agency — the
// workspace is created afterwards (see organization.schema.ts). Keeping the
// two apart is what lets one user later belong to several agencies.

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms & Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: otpTokenSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// ─────────────────────────────────────────────
// Password recovery
// ─────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: otpTokenSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').nullable().optional(),
  locale: z.enum(['en', 'ar', 'fr']).optional(),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
