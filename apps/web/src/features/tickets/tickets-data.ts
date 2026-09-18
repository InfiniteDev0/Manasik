import { matchesDateRange, type DatePickerValue } from '@/components/date-picker';
import type { Currency } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';

/** One ticket sold to a client. Dates are `yyyy-mm-dd`. */
export interface TicketRow {
  id: string;
  date: string;
  client: string;
  airline: string;
  route: string;
  departure: string;
  /** The flight back, or '' for no return (one way). */
  returnDate: string;
  phone: string;
  /** What the amounts below are in. */
  currency: Currency;
  /** Money collected from the client. */
  collected: number | null;
  commission: number | null;
  net: number | null;
  pnr: string;
  /** Who referred the client — a person's name. */
  reference: string;
}

/** A blank ticket dated today. */
export function newTicket(): TicketRow {
  return {
    id: crypto.randomUUID(),
    date: formatDateToString(new Date()),
    client: '',
    airline: '',
    route: '',
    departure: '',
    returnDate: '',
    phone: '',
    currency: 'USD',
    collected: null,
    commission: null,
    net: null,
    pnr: '',
    reference: '',
  };
}

// Placeholder rows so the table has something to show. Not saved anywhere yet.
// Fixed ids and dates (not newTicket()): this module runs on the server and in
// the browser, and random or clock-based values would differ between the two.
export const SAMPLE_TICKETS: TicketRow[] = [
  { id: 'sample-1', date: '2026-09-17', client: 'Amina Yusuf', airline: 'Qatar Airways', route: 'NBO → JED', departure: '2026-09-24', returnDate: '2026-10-08', phone: '+254 712 345 678', currency: 'USD', collected: 780, commission: 40, net: 740, pnr: 'QX7K2L', reference: 'Hassan Abdi' },
  { id: 'sample-2', date: '2026-09-17', client: 'Abdullahi Omar', airline: 'Emirates', route: 'NBO → DXB', departure: '2026-09-30', returnDate: '', phone: '+254 722 111 222', currency: 'USD', collected: 520, commission: 25, net: 495, pnr: 'EM4P9Z', reference: 'Fatuma Noor' },
  { id: 'sample-3', date: '2026-09-16', client: 'Halima Ali', airline: 'Kenya Airways', route: 'NBO → MBA', departure: '2026-09-19', returnDate: '2026-09-22', phone: '+254 733 555 010', currency: 'KES', collected: 12000, commission: 800, net: 11200, pnr: 'KQ2M8R', reference: '' },
];

/**
 * True when every word of the query appears somewhere in the ticket, so
 * "amina qatar" narrows to Amina's Qatar tickets. Case-insensitive.
 */
export function ticketMatchesSearch(ticket: TicketRow, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const text = [
    ticket.client,
    ticket.airline,
    ticket.route,
    ticket.phone,
    ticket.pnr,
    ticket.reference,
    ticket.date,
    ticket.departure,
    ticket.returnDate,
    ticket.currency,
    ticket.collected,
    ticket.commission,
    ticket.net,
  ]
    .filter((value) => value !== null && value !== '')
    .join(' ')
    .toLowerCase();
  return words.every((word) => text.includes(word));
}

export interface TicketCategory {
  id: string;
  label: string;
  /** Which tickets the tab shows. */
  matches: (ticket: TicketRow) => boolean;
}

/** The tabs across the top of the table. Add a category here to get a new tab. */
export const TICKET_CATEGORIES: TicketCategory[] = [{ id: 'all', label: 'All tickets', matches: () => true }];

/** The ticket dates a range can be matched against. */
export type TicketDateField = 'date' | 'departure';

/**
 * Whether the ticket's created or departure date is the picked day, or inside
 * the picked range. A ticket with no departure date drops out while the picker
 * is on Departure.
 */
export function ticketMatchesDate(
  ticket: TicketRow,
  picked: DatePickerValue,
  field: TicketDateField = 'date',
): boolean {
  return matchesDateRange(ticket[field], picked);
}
