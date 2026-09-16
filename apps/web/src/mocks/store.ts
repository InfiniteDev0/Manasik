'use client';

import * as React from 'react';

import type {
  Booking,
  DepartureGroup,
  Invoice,
  Payment,
  PilgrimDocument,
  TravelPackage,
} from '@manasik/types';

import {
  activities,
  bookings,
  documents,
  groups,
  invoices,
  packages,
  payments,
  pilgrims,
  type MockPilgrim,
} from './data';

/**
 * In-memory mutable layer over the mock data.
 *
 * <p>Without this, "New package" could only ever add a row to one page's local
 * state — navigate to the detail route and the record would not exist. The
 * prototype is supposed to be clickable end to end, so mutations land in the
 * shared arrays and every subscribed component re-reads.
 *
 * <p>Deliberately *not* persisted. A reload restores the seed data, which is
 * what you want while building: no accumulated junk, no migration story for
 * fixtures. Phase C replaces this file with API calls.
 */

let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return version;
}

/**
 * Runs a query against the mock data and re-runs it whenever anything mutates.
 *
 * <p>Recomputes on every render rather than memoising: these datasets are
 * dozens of rows, and a stale memo caused by a missing dependency is a far
 * more expensive bug than the recompute.
 */
export function useMockQuery<T>(select: () => T): T {
  React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return select();
}

const ORG = 'mock-org';

/** Mock ids only. Real ids come from the database. */
function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Next human-facing reference in a series, e.g. BK-2027-0044.
 *
 * <p>Sequence is per year and derived from what already exists. The real
 * implementation needs a database sequence — deriving it from a client-side
 * max would collide the moment two users book at once.
 */
function nextReference(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const scoped = existing.filter((ref) => ref.startsWith(`${prefix}-${year}-`));

  const highest = scoped.reduce((max, ref) => {
    const parsed = Number.parseInt(ref.split('-')[2] ?? '0', 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);

  return `${prefix}-${year}-${String(highest + 1).padStart(4, '0')}`;
}

function logActivity(
  type: (typeof activities)[number]['type'],
  summary: string,
  href: string | null,
) {
  activities.unshift({
    id: id('act'),
    organizationId: ORG,
    type,
    summary,
    actorName: 'You',
    href,
    createdAt: now(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Packages
// ─────────────────────────────────────────────────────────────────────────────

export type PackageInput = Omit<
  TravelPackage,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'durationDays'
>;

export function createPackage(input: PackageInput): TravelPackage {
  const created: TravelPackage = {
    ...input,
    id: id('pkg'),
    organizationId: ORG,
    durationDays: nightsBetween(input.departureDate, input.returnDate),
    createdAt: now(),
    updatedAt: now(),
  };

  packages.unshift(created);
  emit();
  return created;
}

export function updatePackage(packageId: string, input: PackageInput): void {
  const index = packages.findIndex((p) => p.id === packageId);
  if (index === -1) return;

  packages[index] = {
    ...packages[index],
    ...input,
    durationDays: nightsBetween(input.departureDate, input.returnDate),
    updatedAt: now(),
  };
  emit();
}

export function deletePackage(packageId: string): void {
  const index = packages.findIndex((p) => p.id === packageId);
  if (index === -1) return;

  packages.splice(index, 1);
  emit();
}

/** Inclusive of the departure day, matching how agencies quote "14 days". */
function nightsBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.max(Math.round((end - start) / 86_400_000), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pilgrims
// ─────────────────────────────────────────────────────────────────────────────

export type PilgrimInput = Omit<
  MockPilgrim,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;

export function createPilgrim(input: PilgrimInput): MockPilgrim {
  const created: MockPilgrim = {
    ...input,
    id: id('plg'),
    organizationId: ORG,
    createdAt: now(),
    updatedAt: now(),
  };

  pilgrims.unshift(created);
  // No document records are created: `documentChecklist` synthesises a MISSING
  // row for every required type, so an empty set already reads correctly.
  logActivity('PILGRIM_ADDED', `${created.fullName} added`, '/pilgrims');
  emit();
  return created;
}

export function updatePilgrim(pilgrimId: string, input: PilgrimInput): void {
  const index = pilgrims.findIndex((p) => p.id === pilgrimId);
  if (index === -1) return;

  pilgrims[index] = { ...pilgrims[index], ...input, updatedAt: now() };
  emit();
}

export function deletePilgrim(pilgrimId: string): void {
  const index = pilgrims.findIndex((p) => p.id === pilgrimId);
  if (index === -1) return;

  pilgrims.splice(index, 1);
  emit();
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────

export interface BookingInput {
  pilgrimId: string;
  packageId: string;
  bookingDate: string;
  discount: number;
  groupId: string | null;
  notes: string;
  status: Booking['status'];
}

/**
 * Creates a booking and its invoice together.
 *
 * <p>One booking always has exactly one invoice — creating them separately
 * would allow a booking with no way to be paid, and every balance calculation
 * assumes the invoice exists.
 */
export function createBooking(input: BookingInput): Booking {
  const pkg = packages.find((p) => p.id === input.packageId);
  const price = pkg?.pricePerPilgrim ?? 0;

  const booking: Booking = {
    id: id('bkg'),
    organizationId: ORG,
    reference: nextReference('BK', bookings.map((b) => b.reference)),
    pilgrimId: input.pilgrimId,
    packageId: input.packageId,
    bookingDate: input.bookingDate,
    packagePrice: price,
    discount: input.discount,
    status: input.status,
    groupId: input.groupId,
    notes: input.notes,
    createdAt: now(),
    updatedAt: now(),
  };

  const invoice: Invoice = {
    id: id('inv'),
    organizationId: ORG,
    number: nextReference('INV', invoices.map((i) => i.number)),
    bookingId: booking.id,
    total: price - input.discount,
    currency: pkg?.currency ?? 'USD',
    dueDate: pkg?.paymentDueDate ?? pkg?.departureDate ?? today(),
    createdAt: now(),
  };

  bookings.unshift(booking);
  invoices.unshift(invoice);

  const pilgrim = pilgrims.find((p) => p.id === input.pilgrimId);
  logActivity(
    'BOOKING_CREATED',
    `Booking ${booking.reference} created for ${pilgrim?.fullName ?? 'a pilgrim'}`,
    '/bookings',
  );

  emit();
  return booking;
}

export function updateBooking(bookingId: string, input: Partial<BookingInput>): void {
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) return;

  const next = { ...bookings[index], ...input, updatedAt: now() };
  bookings[index] = next;

  // The invoice total tracks the discount — leaving it stale would make every
  // balance on the payments page wrong.
  const invoiceIndex = invoices.findIndex((i) => i.bookingId === bookingId);
  if (invoiceIndex !== -1) {
    invoices[invoiceIndex] = {
      ...invoices[invoiceIndex],
      total: next.packagePrice - next.discount,
    };
  }

  emit();
}

export function setBookingStatus(bookingId: string, status: Booking['status']): void {
  updateBooking(bookingId, { status });

  if (status === 'CONFIRMED') {
    const booking = bookings.find((b) => b.id === bookingId);
    logActivity('BOOKING_CONFIRMED', `Booking ${booking?.reference ?? ''} confirmed`, '/bookings');
  }
}

export function assignBookingToGroup(bookingId: string, groupId: string | null): void {
  updateBooking(bookingId, { groupId });

  if (groupId) {
    const booking = bookings.find((b) => b.id === bookingId);
    const pilgrim = pilgrims.find((p) => p.id === booking?.pilgrimId);
    const group = groups.find((g) => g.id === groupId);
    logActivity(
      'PILGRIM_ASSIGNED_TO_GROUP',
      `${pilgrim?.fullName ?? 'A pilgrim'} assigned to ${group?.name ?? 'a group'}`,
      '/groups',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: Payment['method'];
  externalReference: string | null;
  note: string;
}

export function recordPayment(input: PaymentInput): Payment {
  const created: Payment = {
    ...input,
    id: id('pmt'),
    organizationId: ORG,
    reference: nextReference('PMT', payments.map((p) => p.reference)),
    receiptUrl: null,
    recordedBy: 'You',
    createdAt: now(),
  };

  payments.unshift(created);

  const invoice = invoices.find((i) => i.id === input.invoiceId);
  const booking = bookings.find((b) => b.id === invoice?.bookingId);
  const pilgrim = pilgrims.find((p) => p.id === booking?.pilgrimId);
  logActivity(
    'PAYMENT_RECORDED',
    `Payment recorded for ${pilgrim?.fullName ?? 'a pilgrim'}`,
    '/payments',
  );

  emit();
  return created;
}

export function deletePayment(paymentId: string): void {
  const index = payments.findIndex((p) => p.id === paymentId);
  if (index === -1) return;

  payments.splice(index, 1);
  emit();
}

// ─────────────────────────────────────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────────────────────────────────────

export type GroupInput = Omit<
  DepartureGroup,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;

export function createGroup(input: GroupInput): DepartureGroup {
  const created: DepartureGroup = {
    ...input,
    id: id('grp'),
    organizationId: ORG,
    createdAt: now(),
    updatedAt: now(),
  };

  groups.unshift(created);
  logActivity('GROUP_CREATED', `Group ${created.name} created`, '/groups');
  emit();
  return created;
}

export function updateGroup(groupId: string, input: Partial<GroupInput>): void {
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return;

  groups[index] = { ...groups[index], ...input, updatedAt: now() };
  emit();
}

export function deleteGroup(groupId: string): void {
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return;

  // Members are unassigned rather than deleted — the bookings are still real.
  for (const booking of bookings) {
    if (booking.groupId === groupId) booking.groupId = null;
  }

  groups.splice(index, 1);
  emit();
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentInput {
  pilgrimId: string;
  type: PilgrimDocument['type'];
  expiryDate: string | null;
  note: string;
}

/**
 * Records an upload.
 *
 * <p>Replaces any existing record of the same type for that pilgrim rather
 * than appending: a pilgrim has one passport, and a list showing three
 * passports in three states is unreadable. Re-uploading resets the status to
 * UPLOADED so a rejected document goes back into the review queue.
 */
export function uploadDocument(input: DocumentInput): PilgrimDocument {
  const created: PilgrimDocument = {
    ...input,
    id: id('doc'),
    organizationId: ORG,
    status: 'UPLOADED',
    fileUrl: `/mock/${input.type.toLowerCase()}.pdf`,
    uploadedAt: now(),
    reviewedBy: null,
    reviewedAt: null,
  };

  const existing = documents.findIndex(
    (doc) => doc.pilgrimId === input.pilgrimId && doc.type === input.type,
  );
  if (existing === -1) {
    documents.unshift(created);
  } else {
    documents[existing] = created;
  }

  const pilgrim = pilgrims.find((p) => p.id === input.pilgrimId);
  logActivity(
    'DOCUMENT_UPLOADED',
    `${input.type.replace(/_/g, ' ').toLowerCase()} uploaded for ${pilgrim?.fullName ?? 'a pilgrim'}`,
    '/documents',
  );

  emit();
  return created;
}

export function reviewDocument(
  documentId: string,
  status: Extract<PilgrimDocument['status'], 'APPROVED' | 'REJECTED'>,
  note = '',
): void {
  const index = documents.findIndex((doc) => doc.id === documentId);
  if (index === -1) return;

  documents[index] = {
    ...documents[index],
    status,
    note,
    reviewedBy: 'You',
    reviewedAt: now(),
  };

  if (status === 'APPROVED') {
    const pilgrim = pilgrims.find((p) => p.id === documents[index].pilgrimId);
    logActivity(
      'DOCUMENT_APPROVED',
      `Document approved for ${pilgrim?.fullName ?? 'a pilgrim'}`,
      '/documents',
    );
  }

  emit();
}
