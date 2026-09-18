import { countryName } from '@/components/country-flag';
import { matchesDateRange, type DatePickerValue } from '@/components/date-picker';
import type { Currency } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';

// A visa starts Pending when it's made, then is approved or rejected.
export type VisaStatus = 'pending' | 'approved' | 'rejected';

/** Where an application has got to. The colours are the badge in the table. */
export const VISA_STATUSES: { id: VisaStatus; label: string; className: string }[] = [
  { id: 'pending', label: 'Pending', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
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
  /** The country the visa is for, as its two-letter code ("AE"); shown by name. */
  country: string;
  /** Who processes the visa — they're paid the net amount once it's approved. */
  broker: string;
  brokerPaid: boolean;
  /** What the amounts below are in. */
  currency: Currency;
  /** What the visa costs you — what the broker is paid. */
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
    country: '',
    broker: '',
    brokerPaid: false,
    currency: 'USD',
    net: null,
    paid: null,
    commission: null,
  };
}

/** Approved, with a broker who hasn't been paid yet — the reminder. */
export function brokerDue(visa: VisaRow): boolean {
  return visa.status === 'approved' && Boolean(visa.broker) && !visa.brokerPaid;
}

// Placeholder rows so the table has something to show. Not saved anywhere yet.
// Fixed ids and dates: this module runs on the server and in the browser, and
// random or clock-based values would differ between the two.
export const SAMPLE_VISAS: VisaRow[] = [
  { id: 'visa-1', date: '2026-09-17', name: 'AMINA YUSUF', status: 'approved', country: 'AE', broker: 'Omar Visas', brokerPaid: false, currency: 'USD', net: 280, paid: 320, commission: 40 },
  { id: 'visa-2', date: '2026-09-16', name: 'ABDULLAHI OMAR', status: 'pending', country: 'SA', broker: 'Al Noor Services', brokerPaid: false, currency: 'USD', net: 250, paid: 280, commission: 30 },
  { id: 'visa-3', date: '2026-09-15', name: 'HALIMA ALI', status: 'pending', country: 'TR', broker: '', brokerPaid: false, currency: 'KES', net: 24000, paid: 27000, commission: 3000 },
];

export interface VisaCategory {
  id: string;
  label: string;
  /** Which visas the tab shows. */
  matches: (visa: VisaRow) => boolean;
}

/** The tabs across the top of the table: all of them, one per status, then the brokers still owed. */
export const VISA_CATEGORIES: VisaCategory[] = [
  { id: 'all', label: 'All visas', matches: () => true },
  ...VISA_STATUSES.map((status) => ({
    id: status.id,
    label: status.label,
    matches: (visa: VisaRow) => visa.status === status.id,
  })),
  { id: 'broker', label: 'Pay broker', matches: brokerDue },
];

/**
 * True when every word of the query appears somewhere in the visa, so
 * "amina emirates" narrows to Amina's UAE visas. Case-insensitive.
 */
export function visaMatchesSearch(visa: VisaRow, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const text = [
    visa.name,
    countryName(visa.country),
    visa.broker,
    visaStatusLabel(visa.status),
    visa.date,
    visa.currency,
    visa.net,
    visa.paid,
    visa.commission,
  ]
    .filter((value) => value !== null && value !== '')
    .join(' ')
    .toLowerCase();
  return words.every((word) => text.includes(word));
}

/** Whether the visa was created on the picked day, or inside the picked range. */
export function visaMatchesDate(visa: VisaRow, picked: DatePickerValue): boolean {
  return matchesDateRange(visa.date, picked);
}
