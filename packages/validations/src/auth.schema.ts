import { z } from 'zod';

// ─────────────────────────────────────────────
// Shared rules
// ─────────────────────────────────────────────
//
// These schemas drive the frontend forms. The Spring API re-validates every
// field with Jakarta Validation — never trust these as the enforcement layer.
// Keep the two in sync when a rule changes.

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

const otpTokenSchema = z
  .string()
  .length(6, 'Code must be exactly 6 digits')
  .regex(/^[0-9]+$/, 'Code must contain digits only');

const personNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters')
  .trim();

// Loose on purpose — this is a global product and phone formats vary wildly.
// Normalize to E.164 at the API boundary rather than rejecting here.
const phoneSchema = z
  .string()
  .min(6, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[+]?[0-9\s()-]+$/, 'Phone number contains invalid characters')
  .trim();

// ISO 3166-1 alpha-2, e.g. "SO", "SA", "GB".
const countrySchema = z
  .string()
  .length(2, 'Country must be a 2-letter country code')
  .toUpperCase();

// IANA zone, e.g. "Africa/Mogadishu".
const timezoneSchema = z.string().min(1, 'Timezone is required');

// ISO 4217, e.g. "USD", "SAR".
const currencySchema = z
  .string()
  .length(3, 'Currency must be a 3-letter currency code')
  .toUpperCase();

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
//
// One submit creates BOTH the agency (the tenant) and its OWNER user, in a
// single transaction server-side. There is no "create agency later" step.

export const registerSchema = z.object({
  agencyName: z
    .string()
    .min(2, 'Agency name must be at least 2 characters')
    .max(150, 'Agency name must be at most 150 characters')
    .trim(),
  ownerName: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  country: countrySchema,
  timezone: timezoneSchema,
  currency: currencySchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' }),
  }),
});

// ─────────────────────────────────────────────
// Session
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: otpTokenSchema,
});

export const resendOtpSchema = z.object({
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
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: personNameSchema.optional(),
  phone: phoneSchema.nullable().optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').nullable().optional(),
  locale: z.enum(['en', 'ar', 'fr']).optional(),
});

// ─────────────────────────────────────────────
// Team invitations
// ─────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: emailSchema,
  name: personNameSchema,
  role: z.enum(['ADMIN', 'OPERATIONS', 'FINANCE', 'GUIDE', 'SUPPORT'], {
    errorMap: () => ({ message: 'Choose a valid role' }),
  }),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
