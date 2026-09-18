import { matchesDateRange, type DatePickerValue } from '@/components/date-picker';
import type { Currency } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';

export type VisaStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

/** Where an application has got to. The colours are the badge in the table. */
export const VISA_STATUSES: { id: VisaStatus; label: string; className: string }[] = [
  { id: 'pending', label: 'Pending', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'submitted', label: 'Submitted', className: 'bg-ocean-blue/15 text-ocean-blue' },
  { id: 'approved', label: 'Approved', className: 'bg-ocean-green/10 text-ocean-green' },
  { id: 'rejected', label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
];

export function visaStatusLabel(status: VisaStatus): string {
  return VISA_STATUSES.find((option) => option.id === status)?.label ?? status;
}

/** One visa handled for a client. `date` is the day it was created, `yyyy-mm-dd`. */
export interface VisaRow {
  id: string;
  date: string;
  name: string;
  status: VisaStatus;
  /** The city the visa is for. */
  city: string;
  /** What the amounts below are in. */
  currency: Currency;
  net: number | null;
  paid: number | null;
  commission: number | null;
}

/** A blank visa dated today. */
export function newVisa(): VisaRow {
  return {
    id: crypto.randomUUID(),
    date: formatDateToString(new Date()),
    name: '',
    status: 'pending',
    currency: 'USD',
    city: '',
    net: null,
    paid: null,
    commission: null,
  };
}

// Placeholder rows so the table has something to show. Not saved anywhere yet.
// Fixed ids and dates: this module runs on the server and in the browser, and
// random or clock-based values would differ between the two.
export const SAMPLE_VISAS: VisaRow[] = [
  { id: 'visa-1', date: '2026-09-17', name: 'Amina Yusuf', status: 'approved', city: 'Dubai', currency: 'USD', net: 320, paid: 320, commission: 40 },
  { id: 'visa-2', date: '2026-09-16', name: 'Abdullahi Omar', status: 'submitted', city: 'Jeddah', currency: 'USD', net: 280, paid: 150, commission: 30 },
  { id: 'visa-3', date: '2026-09-15', name: 'Halima Ali', status: 'pending', city: 'Istanbul', currency: 'KES', net: 27000, paid: 0, commission: 3000 },
];

export interface VisaCategory {
  id: string;
  label: string;
  /** Which visas the tab shows. */
  matches: (visa: VisaRow) => boolean;
}

/** The tabs across the top of the table: all of them, then one per status. */
export const VISA_CATEGORIES: VisaCategory[] = [
  { id: 'all', label: 'All visas', matches: () => true },
  ...VISA_STATUSES.map((status) => ({
    id: status.id,
    label: status.label,
    matches: (visa: VisaRow) => visa.status === status.id,
  })),
];

/**
 * True when every word of the query appears somewhere in the visa, so
 * "amina dubai" narrows to Amina's Dubai visas. Case-insensitive.
 */
export function visaMatchesSearch(visa: VisaRow, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const text = [visa.name, visa.city, visaStatusLabel(visa.status), visa.date, visa.currency, visa.net, visa.paid, visa.commission]
    .filter((value) => value !== null && value !== '')
    .join(' ')
    .toLowerCase();
  return words.every((word) => text.includes(word));
}

/** Whether the visa was created on the picked day, or inside the picked range. */
export function visaMatchesDate(visa: VisaRow, picked: DatePickerValue): boolean {
  return matchesDateRange(visa.date, picked);
}
