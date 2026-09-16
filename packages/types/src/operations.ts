// ─────────────────────────────────────────────
// Pilgrim operations domain
// ─────────────────────────────────────────────
//
// The workflow these serve:
//
//   Package → Pilgrim → Booking → Documents & Payments → Group → Complete
//
// Money is always minor units (cents) as an integer. Floating point on
// currency accumulates rounding error, and "why is the balance 0.009" is a
// terrible bug to chase. Format at the edge, never store a float.

// USD first because it is the default: Hajj and Umrah are quoted and settled
// in dollars regardless of where the agency is based.
export type Currency = 'USD' | 'KES' | 'SAR' | 'AED' | 'GBP' | 'EUR';

// ─────────────────────────────────────────────
// Package
// ─────────────────────────────────────────────

export type PilgrimageType = 'UMRAH' | 'HAJJ';

export type PackageStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'COMPLETED';

export interface TravelPackage {
  id: string;
  organizationId: string;
  name: string;
  type: PilgrimageType;
  destination: string;
  departureDate: string; // ISO date
  returnDate: string;
  durationDays: number;
  /** Minor units. */
  pricePerPilgrim: number;
  currency: Currency;
  capacity: number;
  /** Minor units. Zero means no deposit required. */
  depositAmount: number;
  paymentDueDate: string | null;
  description: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: string;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Booking
// ─────────────────────────────────────────────

export type BookingStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  organizationId: string;
  /** Human-facing, e.g. BK-2027-0043. Never expose the UUID in the UI. */
  reference: string;
  pilgrimId: string;
  packageId: string;
  bookingDate: string;
  /** Minor units, before discount. */
  packagePrice: number;
  discount: number;
  status: BookingStatus;
  /** Set once a confirmed booking joins a departure cohort. */
  groupId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Invoice & Payment
// ─────────────────────────────────────────────
//
// One booking → one invoice → many payments.
//
// ⚠️ `balanceDue` is NEVER a stored field. It is always
// `total - sum(payments)`, computed at read time. A stored balance drifts the
// moment a payment is edited or voided, and reconciling it afterwards is
// guesswork. Use the helpers in @/lib/money.

export type PaymentMethod = 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD';

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface Invoice {
  id: string;
  organizationId: string;
  /** Human-facing, e.g. INV-2027-0043. */
  number: string;
  bookingId: string;
  /** Minor units. Package price minus discount. */
  total: number;
  currency: Currency;
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  organizationId: string;
  /** Human-facing, e.g. PMT-2027-0112. */
  reference: string;
  invoiceId: string;
  /** Minor units. */
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  /** M-Pesa code, bank reference, card auth — whatever the method produces. */
  externalReference: string | null;
  receiptUrl: string | null;
  /** User id of whoever recorded it. */
  recordedBy: string;
  note: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────

export type DocumentType =
  | 'PASSPORT'
  | 'PASSPORT_PHOTO'
  | 'VISA'
  | 'VACCINATION'
  | 'INSURANCE'
  | 'CONTRACT';

export type DocumentStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface PilgrimDocument {
  id: string;
  organizationId: string;
  /** Documents belong to the PILGRIM, not the booking — they outlive any one trip. */
  pilgrimId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
  /** Passport and visa expiry drive departure-readiness warnings. */
  expiryDate: string | null;
  uploadedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  note: string;
}

// ─────────────────────────────────────────────
// Group — one departure cohort
// ─────────────────────────────────────────────

export type GroupStatus =
  | 'PLANNING'
  | 'OPEN'
  | 'READY'
  | 'TRAVELLING'
  | 'COMPLETED';

export interface DepartureGroup {
  id: string;
  organizationId: string;
  /** e.g. "Ramadan Umrah — March 2027 — Group A". */
  name: string;
  packageId: string;
  departureDate: string;
  returnDate: string;
  capacity: number;
  guideId: string | null;
  status: GroupStatus;
  meetingPoint: string;
  itinerary: string;
  /** Free text for MVP — no hotel/transport/flight inventory yet. */
  hotelNotes: string;
  transportNotes: string;
  flightNotes: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  email: string;
  languages: string[];
}

// ─────────────────────────────────────────────
// Activity feed
// ─────────────────────────────────────────────

export type ActivityType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_RECORDED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_APPROVED'
  | 'PILGRIM_ADDED'
  | 'PILGRIM_ASSIGNED_TO_GROUP'
  | 'GROUP_CREATED';

export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  /** Rendered directly — already past tense and human-readable. */
  summary: string;
  actorName: string;
  /** Where clicking it should go, relative to the workspace. */
  href: string | null;
  createdAt: string;
}
