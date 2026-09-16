import type { Currency, Invoice, InvoiceStatus, Payment } from '@manasik/types';

/**
 * Money helpers.
 *
 * <p>Amounts are integer minor units everywhere. Formatting happens here, at
 * the edge, and nowhere else.
 */

/**
 * The currency packages are priced in.
 *
 * <p>USD, because Hajj and Umrah are quoted and settled in dollars — Saudi
 * suppliers, flights and visa fees all are, so agency pricing follows. Local
 * currency appears only where a specific record carries its own.
 *
 * <p>Referenced rather than hardcoded in form labels so changing it is one
 * edit, not a search for every "(USD)" in the JSX.
 */
export const DEFAULT_CURRENCY: Currency = 'USD';

/** Formats minor units for display. 350000 → "$3,500". */
export function formatMoney(minorUnits: number, currency: Currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    // Whole units read better for travel pricing; nobody quotes a package to
    // the cent. Payments still store exact minor units.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
}

/** For inputs — no symbol, no grouping. */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/**
 * Total received against an invoice.
 *
 * <p>Always derived from the payment records. There is deliberately no
 * `amountPaid` field to read instead — one would drift the moment a payment is
 * edited or voided.
 */
export function totalPaid(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * `balance_due = invoice_total - sum(payments)` — spec rule 6.
 *
 * <p>Never stored, never typed in by staff. Clamped at zero so an overpayment
 * (which the MVP does not allow, but data migrations might produce) shows as
 * settled rather than as a negative balance.
 */
export function balanceDue(invoice: Invoice, payments: Payment[]): number {
  return Math.max(invoice.total - totalPaid(payments), 0);
}

/**
 * Derives the invoice status — spec rules under "Automatic status rules".
 *
 * <p>Status is computed, not stored: a stored one goes stale the instant a due
 * date passes, with nothing to trigger the update.
 */
export function invoiceStatus(
  invoice: Invoice,
  payments: Payment[],
  now: Date = new Date(),
): InvoiceStatus {
  const paid = totalPaid(payments);
  const balance = Math.max(invoice.total - paid, 0);

  if (balance === 0 && invoice.total > 0) {
    return 'PAID';
  }
  // Overdue outranks unpaid/partial: if money is late, that is the thing the
  // finance user needs to see.
  if (balance > 0 && new Date(invoice.dueDate) < now) {
    return 'OVERDUE';
  }
  if (paid === 0) {
    return 'UNPAID';
  }
  return 'PARTIALLY_PAID';
}

/** Percentage settled, for progress bars. */
export function paidPercentage(invoice: Invoice, payments: Payment[]): number {
  if (invoice.total <= 0) {
    return 100;
  }
  return Math.min(Math.round((totalPaid(payments) / invoice.total) * 100), 100);
}
