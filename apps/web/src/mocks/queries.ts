import type {
  Booking,
  DepartureGroup,
  Invoice,
  Payment,
  PilgrimDocument,
  TravelPackage,
} from '@manasik/types';

import { balanceDue, invoiceStatus, totalPaid } from '@/lib/money';

import {
  activities,
  bookings,
  documents,
  groups,
  guides,
  invoices,
  packages,
  payments,
  pilgrims,
  type MockPilgrim,
} from './data';

/**
 * The read layer over the mock data.
 *
 * <p>Pages call these, never the raw arrays. When Phase C swaps mocks for the
 * API, the call sites keep their shape and only these bodies change — a page
 * that reached into `bookings.filter(...)` itself would have to be rewritten.
 *
 * <p>Everything derived (balances, statuses, counts) is computed here rather
 * than stored, per the spec's rule that `balance_due` and invoice status are
 * never persisted fields.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Packages
// ─────────────────────────────────────────────────────────────────────────────

export interface PackageRow extends TravelPackage {
  /** Confirmed + pending bookings — a pending seat is still a held seat. */
  bookedCount: number;
  seatsRemaining: number;
  /** Sum of everything received against this package's bookings. Minor units. */
  revenueCollected: number;
}

export function listPackages(): PackageRow[] {
  return packages.map(toPackageRow);
}

export function getPackage(id: string): PackageRow | undefined {
  const found = packages.find((p) => p.id === id);
  return found ? toPackageRow(found) : undefined;
}

function toPackageRow(pkg: TravelPackage): PackageRow {
  const own = bookings.filter((b) => b.packageId === pkg.id && b.status !== 'CANCELLED');
  const revenueCollected = own.reduce((sum, booking) => {
    const invoice = invoiceForBooking(booking.id);
    return invoice ? sum + totalPaid(paymentsForInvoice(invoice.id)) : sum;
  }, 0);

  return {
    ...pkg,
    bookedCount: own.length,
    seatsRemaining: Math.max(pkg.capacity - own.length, 0),
    revenueCollected,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pilgrims
// ─────────────────────────────────────────────────────────────────────────────

export type { MockPilgrim };

export interface PilgrimRow extends MockPilgrim {
  /** The pilgrim's current (most recent non-cancelled) booking, if any. */
  currentBooking: Booking | null;
  currentPackage: TravelPackage | null;
  currentGroup: DepartureGroup | null;
  /** Approved documents over required documents, e.g. 4/6. */
  documentsApproved: number;
  documentsRequired: number;
  /** Outstanding across all of this pilgrim's invoices. Minor units. */
  balanceDue: number;
}

export function listPilgrims(): PilgrimRow[] {
  return pilgrims.map(toPilgrimRow);
}

export function getPilgrim(id: string): PilgrimRow | undefined {
  const found = pilgrims.find((p) => p.id === id);
  return found ? toPilgrimRow(found) : undefined;
}

function toPilgrimRow(pilgrim: MockPilgrim): PilgrimRow {
  const own = bookings
    .filter((b) => b.pilgrimId === pilgrim.id && b.status !== 'CANCELLED')
    .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));

  const currentBooking = own[0] ?? null;
  const docs = documentsForPilgrim(pilgrim.id);

  const balance = own.reduce((sum, booking) => {
    const invoice = invoiceForBooking(booking.id);
    return invoice ? sum + balanceDue(invoice, paymentsForInvoice(invoice.id)) : sum;
  }, 0);

  return {
    ...pilgrim,
    currentBooking,
    currentPackage: currentBooking
      ? (packages.find((p) => p.id === currentBooking.packageId) ?? null)
      : null,
    currentGroup: currentBooking?.groupId
      ? (groups.find((g) => g.id === currentBooking.groupId) ?? null)
      : null,
    documentsApproved: docs.filter((doc) => doc.status === 'APPROVED').length,
    documentsRequired: REQUIRED_DOCUMENTS.length,
    balanceDue: balance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────

export interface BookingRow extends Booking {
  pilgrim: MockPilgrim | null;
  package: TravelPackage | null;
  group: DepartureGroup | null;
  invoice: Invoice | null;
  /** packagePrice - discount. Minor units. */
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: ReturnType<typeof invoiceStatus> | null;
}

export function listBookings(): BookingRow[] {
  return bookings.map(toBookingRow);
}

export function getBooking(id: string): BookingRow | undefined {
  const found = bookings.find((b) => b.id === id);
  return found ? toBookingRow(found) : undefined;
}

export function bookingsForGroup(groupId: string): BookingRow[] {
  return bookings.filter((b) => b.groupId === groupId).map(toBookingRow);
}

export function bookingsForPackage(packageId: string): BookingRow[] {
  return bookings.filter((b) => b.packageId === packageId).map(toBookingRow);
}

function toBookingRow(booking: Booking): BookingRow {
  const invoice = invoiceForBooking(booking.id) ?? null;
  const linked = invoice ? paymentsForInvoice(invoice.id) : [];

  return {
    ...booking,
    pilgrim: pilgrims.find((p) => p.id === booking.pilgrimId) ?? null,
    package: packages.find((p) => p.id === booking.packageId) ?? null,
    group: booking.groupId ? (groups.find((g) => g.id === booking.groupId) ?? null) : null,
    invoice,
    totalAmount: booking.packagePrice - booking.discount,
    amountPaid: totalPaid(linked),
    balanceDue: invoice ? balanceDue(invoice, linked) : booking.packagePrice - booking.discount,
    paymentStatus: invoice ? invoiceStatus(invoice, linked) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoices & payments
// ─────────────────────────────────────────────────────────────────────────────

export interface InvoiceRow extends Invoice {
  booking: Booking | null;
  pilgrim: MockPilgrim | null;
  package: TravelPackage | null;
  payments: Payment[];
  amountPaid: number;
  balanceDue: number;
  status: ReturnType<typeof invoiceStatus>;
}

export function listInvoices(): InvoiceRow[] {
  return invoices.map(toInvoiceRow);
}

export function getInvoice(id: string): InvoiceRow | undefined {
  const found = invoices.find((i) => i.id === id);
  return found ? toInvoiceRow(found) : undefined;
}

export function invoiceForBooking(bookingId: string): Invoice | undefined {
  return invoices.find((i) => i.bookingId === bookingId);
}

export function paymentsForInvoice(invoiceId: string): Payment[] {
  return payments.filter((p) => p.invoiceId === invoiceId);
}

function toInvoiceRow(invoice: Invoice): InvoiceRow {
  const linked = paymentsForInvoice(invoice.id);
  const booking = bookings.find((b) => b.id === invoice.bookingId) ?? null;

  return {
    ...invoice,
    booking,
    pilgrim: booking ? (pilgrims.find((p) => p.id === booking.pilgrimId) ?? null) : null,
    package: booking ? (packages.find((p) => p.id === booking.packageId) ?? null) : null,
    payments: linked,
    amountPaid: totalPaid(linked),
    balanceDue: balanceDue(invoice, linked),
    status: invoiceStatus(invoice, linked),
  };
}

export interface PaymentRow extends Payment {
  invoice: Invoice | null;
  pilgrim: MockPilgrim | null;
  bookingReference: string | null;
}

export function listPayments(): PaymentRow[] {
  return payments
    .map((payment): PaymentRow => {
      const invoice = invoices.find((i) => i.id === payment.invoiceId) ?? null;
      const booking = invoice ? (bookings.find((b) => b.id === invoice.bookingId) ?? null) : null;

      return {
        ...payment,
        invoice,
        pilgrim: booking ? (pilgrims.find((p) => p.id === booking.pilgrimId) ?? null) : null,
        bookingReference: booking?.reference ?? null,
      };
    })
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What every pilgrim must have before departure.
 *
 * <p>Fixed for the MVP. Making it configurable per organisation is a later
 * decision — hardcoding it now keeps readiness computable without a settings
 * lookup on every row.
 */
export const REQUIRED_DOCUMENTS: PilgrimDocument['type'][] = [
  'PASSPORT',
  'PASSPORT_PHOTO',
  'VISA',
  'VACCINATION',
  'INSURANCE',
  'CONTRACT',
];

export function documentsForPilgrim(pilgrimId: string): PilgrimDocument[] {
  return documents.filter((doc) => doc.pilgrimId === pilgrimId);
}

export interface DocumentRow extends PilgrimDocument {
  pilgrim: MockPilgrim | null;
}

export function listDocuments(): DocumentRow[] {
  return documents.map((doc) => ({
    ...doc,
    pilgrim: pilgrims.find((p) => p.id === doc.pilgrimId) ?? null,
  }));
}

/**
 * Per-pilgrim document completeness for the checklist matrix.
 *
 * <p>Returns a row for every required type, inventing a MISSING placeholder
 * where no record exists — the checklist has to show the gap, and an absent
 * array entry renders as nothing at all.
 */
export function documentChecklist(pilgrimId: string): PilgrimDocument[] {
  const own = documentsForPilgrim(pilgrimId);

  return REQUIRED_DOCUMENTS.map(
    (type) =>
      own.find((doc) => doc.type === type) ?? {
        id: `${pilgrimId}-${type}-missing`,
        organizationId: 'mock-org',
        pilgrimId,
        type,
        status: 'MISSING' as const,
        fileUrl: null,
        expiryDate: null,
        uploadedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        note: '',
      },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupRow extends DepartureGroup {
  package: TravelPackage | null;
  guideName: string | null;
  pilgrimCount: number;
  seatsRemaining: number;
  /** Members whose paperwork or payment would stop them boarding. */
  blockedCount: number;
  /** Human-readable reasons the group is not departure-ready. */
  readinessIssues: string[];
}

export function listGroups(): GroupRow[] {
  return groups.map(toGroupRow);
}

export function getGroup(id: string): GroupRow | undefined {
  const found = groups.find((g) => g.id === id);
  return found ? toGroupRow(found) : undefined;
}

export function listGuides() {
  return guides;
}

function toGroupRow(group: DepartureGroup): GroupRow {
  const members = bookingsForGroup(group.id);
  const issues: string[] = [];

  if (!group.guideId) {
    issues.push('No guide assigned');
  }

  const blocked = members.filter((member) => {
    if (!member.pilgrim) return false;
    return departureBlockers(member).length > 0;
  });

  if (blocked.length > 0) {
    issues.push(`${blocked.length} pilgrim(s) not cleared for departure`);
  }
  if (members.length === 0) {
    issues.push('No pilgrims assigned');
  }

  return {
    ...group,
    package: packages.find((p) => p.id === group.packageId) ?? null,
    guideName: guides.find((g) => g.id === group.guideId)?.fullName ?? null,
    pilgrimCount: members.length,
    seatsRemaining: Math.max(group.capacity - members.length, 0),
    blockedCount: blocked.length,
    readinessIssues: issues,
  };
}

/**
 * Why a booking is not cleared to travel — empty means ready.
 *
 * <p>Deliberately returns reasons rather than a boolean: "not ready" alone
 * sends staff hunting through tabs for the cause.
 */
export function departureBlockers(booking: BookingRow): string[] {
  const reasons: string[] = [];

  if (booking.balanceDue > 0) {
    reasons.push('Outstanding balance');
  }

  if (!booking.pilgrim) {
    return reasons;
  }

  const checklist = documentChecklist(booking.pilgrim.id);

  const missing = checklist.filter((doc) => doc.status === 'MISSING');
  if (missing.length > 0) {
    reasons.push(`${missing.length} document(s) missing`);
  }

  const rejected = checklist.filter((doc) => doc.status === 'REJECTED');
  if (rejected.length > 0) {
    reasons.push(`${rejected.length} document(s) rejected`);
  }

  // Expiry is checked against the RETURN date, not today: a passport valid at
  // departure but not at return still fails at the airport.
  const returnDate = booking.package?.returnDate;
  if (returnDate) {
    const expiring = checklist.filter(
      (doc) => doc.expiryDate !== null && doc.expiryDate < returnDate,
    );
    if (expiring.length > 0) {
      reasons.push(`${expiring.length} document(s) expire before return`);
    }
  }

  return reasons;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard aggregates
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  activePilgrims: number;
  upcomingDepartures: number;
  /** Received in the current calendar month. Minor units. */
  revenueThisMonth: number;
  outstandingBalance: number;
  pendingDocuments: number;
  overdueInvoices: number;
}

export function dashboardSummary(now: Date = new Date()): DashboardSummary {
  const today = now.toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const rows = listInvoices();

  return {
    activePilgrims: pilgrims.filter(
      (p) => p.status === 'CONFIRMED' || p.status === 'REGISTERED' || p.status === 'TRAVELLING',
    ).length,
    upcomingDepartures: groups.filter(
      (g) => g.departureDate >= today && g.status !== 'COMPLETED',
    ).length,
    revenueThisMonth: payments
      .filter((p) => p.paymentDate.startsWith(monthPrefix))
      .reduce((sum, p) => sum + p.amount, 0),
    outstandingBalance: rows.reduce((sum, row) => sum + row.balanceDue, 0),
    pendingDocuments: documents.filter(
      (doc) => doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW',
    ).length,
    overdueInvoices: rows.filter((row) => row.status === 'OVERDUE').length,
  };
}

export function recentActivity(limit = 8) {
  return [...activities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Next departures for the dashboard's countdown cards. */
export function upcomingDepartures(now: Date = new Date(), limit = 3): GroupRow[] {
  const today = now.toISOString().slice(0, 10);

  return listGroups()
    .filter((g) => g.departureDate >= today && g.status !== 'COMPLETED')
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
    .slice(0, limit);
}

/** Whole days until a date — negative once it has passed. */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  const from = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((target - from) / 86_400_000);
}
