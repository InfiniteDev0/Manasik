/**
 * Date formatting.
 *
 * <p>Dates cross the wire as ISO strings (`2027-03-05`). They are parsed as
 * UTC explicitly, never with `new Date('2027-03-05')` alone — that is UTC
 * midnight, which in Nairobi (UTC+3) is still the 5th but in any negative
 * offset renders as the 4th. A departure date that shifts by a day depending
 * on the viewer's timezone is a real support ticket.
 */

const NAIROBI = 'Africa/Nairobi';

function parse(isoDate: string): Date {
  // Date-only values get an explicit UTC time; full timestamps are left alone.
  return new Date(isoDate.length === 10 ? `${isoDate}T00:00:00Z` : isoDate);
}

/** "5 Mar 2027" */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parse(isoDate));
}

/** "5 March 2027" — for detail panels where there is room. */
export function formatDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parse(isoDate));
}

/** "5 Mar 2027, 14:20" — timestamps only, shown in the agency's timezone. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: NAIROBI,
  }).format(parse(iso));
}

/** "5–19 Mar 2027", collapsing whatever the two dates share. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parse(startIso);
  const end = parse(endIso);

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' });
    return `${day.format(start)}–${formatDate(endIso)}`;
  }
  if (sameYear) {
    const dayMonth = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    return `${dayMonth.format(start)} – ${formatDate(endIso)}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/** "in 3 weeks", "2 days ago". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffDays = Math.round(
    (parse(iso).getTime() - parse(now.toISOString().slice(0, 10)).getTime()) / 86_400_000,
  );

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  if (Math.abs(diffDays) < 31) return rtf.format(Math.round(diffDays / 7), 'week');
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month');
  return rtf.format(Math.round(diffDays / 365), 'year');
}

/** Age in whole years from a date of birth. */
export function ageFrom(isoDate: string | null | undefined, now: Date = new Date()): number | null {
  if (!isoDate) return null;

  const birth = parse(isoDate);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();

  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Today as an ISO date, for comparisons against the string dates in the data. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
