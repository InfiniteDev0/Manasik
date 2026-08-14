import { z } from 'zod';

// ─────────────────────────────────────────────
// Create-workspace wizard
// ─────────────────────────────────────────────
//
// Three steps, and step 3 is skippable on purpose — forcing a solo owner to
// invite colleagues before they can see the product is a good way to lose them.

// ISO 3166-1 alpha-2, e.g. "KE", "SO", "SA".
const countrySchema = z
  .string()
  .length(2, 'Country must be a 2-letter country code')
  .toUpperCase();

// ISO 4217, e.g. "KES", "USD", "SAR".
const currencySchema = z
  .string()
  .length(3, 'Currency must be a 3-letter currency code')
  .toUpperCase();

// IANA zone, e.g. "Africa/Nairobi".
const timezoneSchema = z.string().min(1, 'Timezone is required');

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Must be a valid email address')
  .toLowerCase()
  .trim();

/** Step 1 — "Let's set up your agency". */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Agency name must be at least 2 characters')
    .max(150, 'Agency name must be at most 150 characters')
    .trim(),
  country: countrySchema,
  currency: currencySchema,
  timezone: timezoneSchema,
});

/** Step 2 — "Tell us about your agency". Optional; the step can be skipped. */
export const organizationProfileSchema = z.object({
  organizationType: z.enum(['UMRAH', 'HAJJ', 'HAJJ_AND_UMRAH']).optional(),
  pilgrimsPerYear: z
    .enum(['UNDER_100', 'FROM_100_TO_500', 'FROM_500_TO_2000', 'OVER_2000'])
    .optional(),
});

/** Step 3 — "Add your team". Skippable. */
export const inviteMemberSchema = z.object({
  email: emailSchema,
  // OWNER is deliberately absent: ownership is transferred, never invited.
  role: z.enum(['ADMIN', 'OPERATIONS', 'SALES', 'FINANCE', 'GUIDE', 'SUPPORT'], {
    errorMap: () => ({ message: 'Choose a valid role' }),
  }),
});

export const inviteTeamSchema = z.object({
  invites: z
    .array(inviteMemberSchema)
    .max(20, 'You can invite at most 20 people at a time')
    // Catching this here gives a clear message instead of a database
    // unique-constraint error surfacing as a 500.
    .refine(
      (invites) => new Set(invites.map((i) => i.email)).size === invites.length,
      { message: 'Each email can only be invited once' },
    ),
});

/** Settings → rename / rebrand an existing workspace. */
export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .extend({
    logoUrl: z.string().url('Logo must be a valid URL').nullable().optional(),
  });

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
