'use client';

import flags from 'react-phone-number-input/flags';
import { getCountries, type Country } from 'react-phone-number-input/input';

import { cn } from '@/lib/utils';

export type { Country };

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

/** "AE" → "United Arab Emirates". Unknown codes come back as they are. */
export function countryName(code: string): string {
  if (!code) return '';
  try {
    return REGION_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * The agency's usual countries, pinned to the top of every country list (phone
 * numbers, visa countries) in this order.
 */
export const TOP_COUNTRY_CODES: Country[] = ['SO', 'KE', 'DE', 'GB', 'US', 'UG'];

/** Every country, by name A–Z. */
export const ALL_COUNTRIES: { code: Country; name: string }[] = getCountries()
  .map((code) => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** A country's flag, sized like a small icon. */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const Flag = flags[code as Country];
  // The flag components take only a title, so the sizing lives on the wrapper.
  return (
    <span
      className={cn(
        'flex h-3.5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-[2px]',
        '[&>svg]:h-full [&>svg]:w-full',
        className,
      )}
    >
      {Flag ? <Flag title={countryName(code)} /> : <span className="text-muted-foreground text-[9px]">{code}</span>}
    </span>
  );
}
