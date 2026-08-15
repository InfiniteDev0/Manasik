'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { SubmitEvent } from 'react';
import { ApiError } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Step 1 of onboarding — create the agency workspace.
 *
 * Steps 2 (agency profile) and 3 (invite team) are deliberately not here: both
 * are skippable in the product spec, and putting them between a new user and a
 * working product is how onboarding flows lose people.
 */

const inputClass =
  'h-12 w-full rounded-lg bg-muted px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition focus-visible:ring-1 focus-visible:ring-ring';

/** Small starter list — the full ISO set belongs behind a searchable combobox. */
const COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'KES', timezone: 'Africa/Nairobi' },
  { code: 'SO', name: 'Somalia', currency: 'USD', timezone: 'Africa/Mogadishu' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', timezone: 'Asia/Riyadh' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', timezone: 'Asia/Dubai' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
  { code: 'US', name: 'United States', currency: 'USD', timezone: 'America/New_York' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', timezone: 'Africa/Addis_Ababa' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', timezone: 'Africa/Dar_es_Salaam' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', timezone: 'Africa/Lagos' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', timezone: 'Asia/Jakarta' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', timezone: 'Asia/Karachi' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const setActiveOrganization = useAuthStore((state) => state.setActiveOrganization);
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const country = COUNTRIES.find((c) => c.code === countryCode);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    if (!country) {
      setErrors({ country: 'Select a country' });
      return;
    }

    setIsLoading(true);
    try {
      // Currency and timezone are derived from the country rather than asked
      // for separately — three dropdowns to create a workspace is friction for
      // information we can infer. Both are editable later in settings.
      const organization = await authApi.createWorkspace({
        name,
        country: country.code,
        currency: country.currency,
        timezone: country.timezone,
      });

      // The API reissues the token with the new organization; the old one
      // carries no tenant and cannot read any workspace data.
      setActiveOrganization(organization.id, organization.accessToken);

      // Refresh the session before navigating. `memberships` in the store is
      // still empty at this point — it was loaded when the user had no
      // workspace — and the workspace layout guards on it. Navigating first
      // would bounce straight back here, in a loop.
      const session = await authApi.me();
      setSession({
        user: session.user,
        accessToken: organization.accessToken,
        memberships: session.memberships,
        activeOrganizationId: session.activeOrganizationId ?? organization.id,
      });

      router.push(`/workspace/${organization.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setErrors(error.fieldErrors);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Could not reach the server. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Image
          src="/mansiklogoblack.png"
          alt="Manasik"
          width={48}
          height={48}
          priority
          className="mb-8 h-12 w-auto dark:invert"
        />

        <h1 className="font-heading text-[2.5rem] font-semibold leading-none tracking-tight">
          Set up your agency
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          This becomes your workspace. You can invite your team once it&apos;s ready.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm text-muted-foreground">
              Agency name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="Baraka Travels"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="country" className="text-sm text-muted-foreground">
              Country
            </label>
            <select
              id="country"
              name="country"
              required
              className={inputClass}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>
                Select a country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
          </div>

          {country && (
            <p className="text-sm text-muted-foreground">
              Currency <span className="text-foreground">{country.currency}</span> · Timezone{' '}
              <span className="text-foreground">{country.timezone}</span>
              <br />
              <span className="text-xs">Both can be changed later in settings.</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !name || !country}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin" size={16} />
                Creating workspace...
              </>
            ) : (
              'Create workspace'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
