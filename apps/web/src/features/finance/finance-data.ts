import type { Currency } from '@/lib/currency';
import { formatDayLabel } from '@/lib/format';

// Quotation → invoice → receipt. A customer asks for a service and gets a
// quotation; when they go ahead it becomes an invoice; once the invoice's
// payment is confirmed, a receipt is printed for them.

// ─── Services ────────────────────────────────────────────────────────────────

export type ServiceType = 'ticket' | 'visa' | 'hotel' | 'package';

export interface ServiceField {
  name: string;
  label: string;
  /**
   * 'airport' picks from the airport list; 'trip' is a departure and a return
   * in one calendar — stored as `<name>` and `return` ('' for no return).
   */
  type?: 'text' | 'date' | 'number' | 'airport' | 'trip';
  placeholder?: string;
}

/**
 * What a customer can ask for, and the details the quotation form asks for
 * each — the form's fields change with the service picked.
 */
export const SERVICES: { id: ServiceType; label: string; fields: ServiceField[] }[] = [
  {
    id: 'ticket',
    label: 'Flight ticket',
    fields: [
      { name: 'airline', label: 'Airline', placeholder: 'e.g. Qatar Airways' },
      { name: 'from', label: 'From', type: 'airport', placeholder: 'From' },
      { name: 'to', label: 'To', type: 'airport', placeholder: 'To' },
      { name: 'departure', label: 'Departure — return', type: 'trip' },
    ],
  },
  {
    id: 'visa',
    label: 'Visa',
    fields: [
      { name: 'city', label: 'City', placeholder: 'e.g. Dubai' },
      { name: 'visaType', label: 'Visa type', placeholder: 'e.g. Tourist, 30 days' },
    ],
  },
  {
    id: 'hotel',
    label: 'Hotel',
    fields: [
      { name: 'hotel', label: 'Hotel', placeholder: 'e.g. Swissôtel Makkah' },
      { name: 'city', label: 'City', placeholder: 'e.g. Makkah' },
      { name: 'checkIn', label: 'Check-in', type: 'date', placeholder: 'Check-in date' },
      { name: 'checkOut', label: 'Check-out', type: 'date', placeholder: 'Check-out date' },
    ],
  },
  {
    id: 'package',
    label: 'Hajj / Umrah',
    fields: [
      { name: 'package', label: 'Package', placeholder: 'e.g. Umrah, 14 nights' },
      { name: 'departure', label: 'Departure', type: 'date', placeholder: 'Departure date' },
      { name: 'travellers', label: 'Travellers', type: 'number', placeholder: 'How many people' },
    ],
  },
];

export function serviceLabel(service: ServiceType): string {
  return SERVICES.find((option) => option.id === service)?.label ?? service;
}

/** Every key a service's details are kept under — a trip field adds `return`. */
export function serviceDetailKeys(service: ServiceType): string[] {
  const fields = SERVICES.find((option) => option.id === service)?.fields ?? [];
  return fields.flatMap((field) => (field.type === 'trip' ? [field.name, 'return'] : [field.name]));
}

/** "Sep 24 → Oct 8, 2026" or "Sep 24, 2026 · No return". */
function tripText(departure: string, returnDate: string | undefined): string {
  return returnDate?.trim()
    ? `${formatDayLabel(departure)} → ${formatDayLabel(returnDate.trim())}`
    : `${formatDayLabel(departure)} · No return`;
}

/** The service's details in one line: "Qatar Airways · NBO → JED · Sep 24, 2026". */
export function describeService(service: ServiceType, details: Record<string, string>): string {
  const fields = SERVICES.find((option) => option.id === service)?.fields ?? [];
  const parts: string[] = [];
  for (const field of fields) {
    const value = details[field.name]?.trim();
    if (!value) continue;
    if (field.name === 'to' && parts.length > 0 && details.from?.trim()) {
      // "NBO" + "JED" read better as one route.
      parts[parts.length - 1] = `${parts[parts.length - 1]} → ${value}`;
    } else if (field.type === 'trip') {
      parts.push(tripText(value, details.return));
    } else if (field.type === 'date') {
      parts.push(formatDayLabel(value));
    } else if (field.name === 'travellers') {
      parts.push(`${value} ${value === '1' ? 'traveller' : 'travellers'}`);
    } else {
      parts.push(value);
    }
  }
  return parts.join(' · ');
}

/**
 * The service's details one per line, for the quotation document:
 * "Airline: Qatar Airways", "Route: NBO → JED", "Departure: Sep 24, 2026".
 */
export function serviceDetailLines(service: ServiceType, details: Record<string, string>): string[] {
  const fields = SERVICES.find((option) => option.id === service)?.fields ?? [];
  const lines: string[] = [];
  for (const field of fields) {
    const value = details[field.name]?.trim();
    if (!value || field.name === 'to') continue;
    if (field.name === 'from') {
      const to = details.to?.trim();
      lines.push(`Route: ${to ? `${value} → ${to}` : value}`);
    } else if (field.type === 'trip') {
      lines.push(`Departure: ${formatDayLabel(value)}`);
      lines.push(`Return: ${details.return?.trim() ? formatDayLabel(details.return.trim()) : 'No return'}`);
    } else {
      lines.push(`${field.label}: ${field.type === 'date' ? formatDayLabel(value) : value}`);
    }
  }
  return lines;
}

// ─── Documents ───────────────────────────────────────────────────────────────

/** A price offered for a service. `date` is the day it was made, `yyyy-mm-dd`. */
export interface Quotation {
  id: string;
  /** QT-0001 */
  number: string;
  date: string;
  client: string;
  phone: string;
  service: ServiceType;
  details: Record<string, string>;
  currency: Currency;
  amount: number | null;
  /** Set once the customer goes ahead and the quotation is invoiced. */
  invoiceId: string | null;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'bank' | 'card';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'card', label: 'Card' },
];

export function paymentMethodLabel(method: PaymentMethod | null): string {
  return PAYMENT_METHODS.find((option) => option.id === method)?.label ?? '—';
}

/** A quotation the customer went ahead with. */
export interface Invoice {
  id: string;
  /** INV-0001 */
  number: string;
  date: string;
  quotationId: string;
  quotationNumber: string;
  client: string;
  phone: string;
  service: ServiceType;
  description: string;
  currency: Currency;
  amount: number | null;
  /** The day the payment was confirmed; null while unpaid. */
  paidOn: string | null;
  method: PaymentMethod | null;
  /** Set once its receipt has been printed. */
  receiptId: string | null;
}

/** Proof of a paid invoice, printed for the customer. `date` is when it was printed. */
export interface Receipt {
  id: string;
  /** RC-0001 */
  number: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  quotationNumber: string;
  client: string;
  phone: string;
  service: ServiceType;
  description: string;
  currency: Currency;
  amount: number | null;
  method: PaymentMethod | null;
}

/** The next number in a series: QT-0003 after QT-0002. */
export function nextNumber(prefix: string, existing: { number: string }[]): string {
  const highest = existing.reduce((max, { number }) => {
    const value = Number(number.slice(prefix.length + 1));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`;
}

// ─── Samples ─────────────────────────────────────────────────────────────────

// Placeholder records so the pages have something to show — one quotation at
// each step: receipted, invoiced but unpaid, and still open. Not saved anywhere
// yet. Fixed ids and dates, so the server and the browser render the same.

const SAMPLE_TICKET_DETAILS = { airline: 'Qatar Airways', from: 'NBO', to: 'JED', departure: '2026-09-24', return: '2026-10-08' };
const SAMPLE_VISA_DETAILS = { city: 'Dubai', visaType: 'Tourist, 30 days' };
const SAMPLE_PACKAGE_DETAILS = { package: 'Umrah, 14 nights', departure: '2026-10-05', travellers: '2' };

export const SAMPLE_QUOTATIONS: Quotation[] = [
  { id: 'qt-1', number: 'QT-0001', date: '2026-09-14', client: 'Amina Yusuf', phone: '+254 712 345 678', service: 'ticket', details: SAMPLE_TICKET_DETAILS, currency: 'USD', amount: 780, invoiceId: 'inv-1' },
  { id: 'qt-2', number: 'QT-0002', date: '2026-09-15', client: 'Abdullahi Omar', phone: '+254 722 111 222', service: 'visa', details: SAMPLE_VISA_DETAILS, currency: 'USD', amount: 320, invoiceId: 'inv-2' },
  { id: 'qt-3', number: 'QT-0003', date: '2026-09-17', client: 'Halima Ali', phone: '+254 733 555 010', service: 'package', details: SAMPLE_PACKAGE_DETAILS, currency: 'USD', amount: 4200, invoiceId: null },
];

export const SAMPLE_INVOICES: Invoice[] = [
  { id: 'inv-1', number: 'INV-0001', date: '2026-09-15', quotationId: 'qt-1', quotationNumber: 'QT-0001', client: 'Amina Yusuf', phone: '+254 712 345 678', service: 'ticket', description: describeService('ticket', SAMPLE_TICKET_DETAILS), currency: 'USD', amount: 780, paidOn: '2026-09-15', method: 'mpesa', receiptId: 'rc-1' },
  { id: 'inv-2', number: 'INV-0002', date: '2026-09-16', quotationId: 'qt-2', quotationNumber: 'QT-0002', client: 'Abdullahi Omar', phone: '+254 722 111 222', service: 'visa', description: describeService('visa', SAMPLE_VISA_DETAILS), currency: 'USD', amount: 320, paidOn: null, method: null, receiptId: null },
];

export const SAMPLE_RECEIPTS: Receipt[] = [
  { id: 'rc-1', number: 'RC-0001', date: '2026-09-15', invoiceId: 'inv-1', invoiceNumber: 'INV-0001', quotationNumber: 'QT-0001', client: 'Amina Yusuf', phone: '+254 712 345 678', service: 'ticket', description: describeService('ticket', SAMPLE_TICKET_DETAILS), currency: 'USD', amount: 780, method: 'mpesa' },
];

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * True when every word of the query appears somewhere in the values, so
 * "amina qt-0001" narrows to Amina's first quotation. Case-insensitive.
 */
export function matchesWords(values: (string | number | null)[], query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const text = values
    .filter((value) => value !== null && value !== '')
    .join(' ')
    .toLowerCase();
  return words.every((word) => text.includes(word));
}
