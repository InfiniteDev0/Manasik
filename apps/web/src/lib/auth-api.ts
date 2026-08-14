import type { MembershipSummary, User } from '@manasik/types';
import { apiFetch } from '@/lib/api';

/** Mirrors AuthResponse from the API. */
export interface AuthPayload {
  accessToken: string;
  user: User;
  memberships: MembershipSummary[];
  activeOrganizationId: string | null;
}

export interface OrganizationPayload {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string;
  currency: string;
  timezone: string;
  role: string;
  /** Reissued token carrying the new active organization. */
  accessToken: string;
  createdAt: string;
}

export const authApi = {
  register(input: {
    fullName: string;
    email: string;
    password: string;
    acceptTerms: true;
  }): Promise<void> {
    return apiFetch('/auth/register', { method: 'POST', body: input });
  },

  verifyEmail(input: { email: string; code: string }): Promise<AuthPayload> {
    return apiFetch<AuthPayload>('/auth/verify-email', { method: 'POST', body: input });
  },

  resendVerification(email: string): Promise<void> {
    return apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
  },

  login(input: { email: string; password: string }): Promise<AuthPayload> {
    return apiFetch<AuthPayload>('/auth/login', { method: 'POST', body: input });
  },

  logout(): Promise<void> {
    return apiFetch('/auth/logout', { method: 'POST' });
  },

  me(): Promise<AuthPayload> {
    return apiFetch<AuthPayload>('/auth/me');
  },

  forgotPassword(email: string): Promise<void> {
    return apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });
  },

  resetPassword(input: { email: string; code: string; password: string }): Promise<void> {
    return apiFetch('/auth/reset-password', { method: 'POST', body: input });
  },

  createWorkspace(input: {
    name: string;
    country: string;
    currency: string;
    timezone: string;
  }): Promise<OrganizationPayload> {
    return apiFetch<OrganizationPayload>('/organizations', { method: 'POST', body: input });
  },

  switchWorkspace(organizationId: string): Promise<OrganizationPayload> {
    return apiFetch<OrganizationPayload>(`/organizations/${organizationId}/switch`, {
      method: 'POST',
    });
  },
};
