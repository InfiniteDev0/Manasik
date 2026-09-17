import type { DatePickerValue } from '@/components/date-picker';
import { formatDateToString } from '@/lib/data-grid';

/** One ticket sold to a client. Dates are `yyyy-mm-dd`. */
export interface TicketRow {
  id: string;
  date: string;
  client: string;
  airline: string;
  route: string;
  departure: string;
  phone: string;
  /** Money collected from the client. */
  collected: number | null;
  commission: number | null;
  net: number | null;
  pnr: string;
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
    phone: '',
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
  { id: 'sample-1', date: '2026-09-17', client: 'Amina Yusuf', airline: 'Qatar Airways', route: 'NBO → JED', departure: '2026-09-24', phone: '+254 712 345 678', collected: 780, commission: 40, net: 740, pnr: 'QX7K2L', reference: 'TK-0001' },
  { id: 'sample-2', date: '2026-09-17', client: 'Abdullahi Omar', airline: 'Emirates', route: 'NBO → DXB', departure: '2026-09-30', phone: '+254 722 111 222', collected: 520, commission: 25, net: 495, pnr: 'EM4P9Z', reference: 'TK-0002' },
  { id: 'sample-3', date: '2026-09-16', client: 'Halima Ali', airline: 'Kenya Airways', route: 'NBO → MBA', departure: '2026-09-19', phone: '+254 733 555 010', collected: 120, commission: 8, net: 112, pnr: 'KQ2M8R', reference: 'TK-0003' },
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

/** Whether a ticket's date is the picked day or inside the picked range. Nothing picked matches all. */
export function ticketMatchesDate(ticket: TicketRow, picked: DatePickerValue): boolean {
  if (picked.mode === 'single') {
    return !picked.value || ticket.date === formatDateToString(picked.value);
  }
  const range = picked.value;
  if (!range?.from) {
    return true;
  }
  const from = formatDateToString(range.from);
  // Only a start picked so far (mid-selection): just that day.
  const to = range.to ? formatDateToString(range.to) : from;
  return ticket.date >= from && ticket.date <= to;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const MONEY_FORMAT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "2026-09-17" → "Sep 17, 2026". Anything unparseable is shown as-is. */
export function formatTicketDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  return DATE_FORMAT.format(new Date(year, month - 1, day));
}

/** 780 → "780.00"; empty → "—". No currency symbol until the currency is decided. */
export function formatTicketMoney(value: number | null): string {
  return value === null ? '—' : MONEY_FORMAT.format(value);
}
