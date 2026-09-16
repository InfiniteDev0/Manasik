import type {
  Activity,
  Booking,
  DepartureGroup,
  Guide,
  Invoice,
  Payment,
  PilgrimDocument,
  TravelPackage,
} from '@manasik/types';

/**
 * One connected mock dataset.
 *
 * <p>Deliberately a single relational graph rather than per-page fixtures: the
 * whole point of the prototype is that clicking a booking reaches a real
 * pilgrim, a real invoice and a real group. Isolated fixtures make every page
 * look finished and every link a dead end.
 *
 * <p>Ids are stable strings (`pkg-1`, `bkg-1`) so relationships are readable
 * while developing. Real ids are UUIDs from the API.
 *
 * <p>Money is minor units — 350000 is $3,500. Hajj and Umrah are priced and
 * settled in USD; local-currency collections are converted on receipt.
 *
 * <p>Context is a Kenyan agency per the spec: M-Pesa and bank collection,
 * Nairobi departures — but USD pricing.
 */

const ORG = 'mock-org';

// ─────────────────────────────────────────────────────────────────────────────
// Pilgrims — mirrors the `pilgrims` table (V4) so wiring later is a swap
// ─────────────────────────────────────────────────────────────────────────────

export interface MockPilgrim {
  id: string;
  organizationId: string;
  fullName: string;
  arabicName: string | null;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  nationality: string;
  email: string | null;
  phone: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  passportNumber: string | null;
  passportExpiry: string | null;
  visaStatus: 'NOT_STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  pilgrimageType: 'UMRAH' | 'HAJJ';
  status: 'LEAD' | 'REGISTERED' | 'CONFIRMED' | 'TRAVELLING' | 'COMPLETED' | 'CANCELLED';
  medicalNotes: string;
  specialRequirements: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const pilgrims: MockPilgrim[] = [
  {
    id: 'plg-1',
    organizationId: ORG,
    fullName: 'Ahmed Hassan Mohamed',
    arabicName: 'أحمد حسن محمد',
    gender: 'MALE',
    dateOfBirth: '1978-04-12',
    nationality: 'KE',
    email: 'ahmed.hassan@example.com',
    phone: '+254 712 345 678',
    city: 'Nairobi',
    country: 'KE',
    emergencyContactName: 'Fatima Hassan',
    emergencyContactPhone: '+254 722 111 222',
    emergencyContactRelation: 'Wife',
    passportNumber: 'AK0847213',
    passportExpiry: '2029-06-30',
    visaStatus: 'APPROVED',
    pilgrimageType: 'UMRAH',
    status: 'CONFIRMED',
    medicalNotes: 'Type 2 diabetes — carries own medication.',
    specialRequirements: 'Ground-floor room preferred.',
    photoUrl: null,
    createdAt: '2026-11-02T09:15:00Z',
    updatedAt: '2027-01-18T14:22:00Z',
  },
  {
    id: 'plg-2',
    organizationId: ORG,
    fullName: 'Amina Yusuf Abdi',
    arabicName: 'أمينة يوسف عبدي',
    gender: 'FEMALE',
    dateOfBirth: '1985-09-23',
    nationality: 'KE',
    email: 'amina.yusuf@example.com',
    phone: '+254 733 908 771',
    city: 'Mombasa',
    country: 'KE',
    emergencyContactName: 'Yusuf Abdi',
    emergencyContactPhone: '+254 700 554 331',
    emergencyContactRelation: 'Brother',
    passportNumber: 'BK1129504',
    passportExpiry: '2027-03-14', // Expires soon — drives a readiness warning.
    visaStatus: 'SUBMITTED',
    pilgrimageType: 'UMRAH',
    status: 'CONFIRMED',
    medicalNotes: '',
    specialRequirements: 'Travelling with her mother — rooms together.',
    photoUrl: null,
    createdAt: '2026-11-08T11:40:00Z',
    updatedAt: '2027-01-20T08:05:00Z',
  },
  {
    id: 'plg-3',
    organizationId: ORG,
    fullName: 'Halima Yusuf Abdi',
    arabicName: 'حليمة يوسف عبدي',
    gender: 'FEMALE',
    dateOfBirth: '1958-02-11',
    nationality: 'KE',
    email: null,
    phone: '+254 733 908 772',
    city: 'Mombasa',
    country: 'KE',
    emergencyContactName: 'Amina Yusuf Abdi',
    emergencyContactPhone: '+254 733 908 771',
    emergencyContactRelation: 'Daughter',
    passportNumber: 'BK0338117',
    passportExpiry: '2028-11-02',
    visaStatus: 'SUBMITTED',
    pilgrimageType: 'UMRAH',
    status: 'CONFIRMED',
    medicalNotes: 'Limited mobility — wheelchair required at airports.',
    specialRequirements: 'Wheelchair assistance. Room with her daughter.',
    photoUrl: null,
    createdAt: '2026-11-08T11:52:00Z',
    updatedAt: '2027-01-20T08:06:00Z',
  },
  {
    id: 'plg-4',
    organizationId: ORG,
    fullName: 'Ibrahim Omar Farah',
    arabicName: null,
    gender: 'MALE',
    dateOfBirth: '1990-12-01',
    nationality: 'KE',
    email: 'ibrahim.farah@example.com',
    phone: '+254 741 220 908',
    city: 'Nairobi',
    country: 'KE',
    emergencyContactName: 'Sahra Farah',
    emergencyContactPhone: '+254 720 887 220',
    emergencyContactRelation: 'Sister',
    passportNumber: null, // Still a lead — no documents yet.
    passportExpiry: null,
    visaStatus: 'NOT_STARTED',
    pilgrimageType: 'HAJJ',
    status: 'LEAD',
    medicalNotes: '',
    specialRequirements: '',
    photoUrl: null,
    createdAt: '2027-01-14T16:20:00Z',
    updatedAt: '2027-01-14T16:20:00Z',
  },
  {
    id: 'plg-5',
    organizationId: ORG,
    fullName: 'Zainab Ali Noor',
    arabicName: 'زينب علي نور',
    gender: 'FEMALE',
    dateOfBirth: '1972-07-19',
    nationality: 'KE',
    email: 'zainab.noor@example.com',
    phone: '+254 718 443 019',
    city: 'Nakuru',
    country: 'KE',
    emergencyContactName: 'Ali Noor',
    emergencyContactPhone: '+254 719 220 118',
    emergencyContactRelation: 'Husband',
    passportNumber: 'CK4471290',
    passportExpiry: '2030-01-22',
    visaStatus: 'APPROVED',
    pilgrimageType: 'UMRAH',
    status: 'COMPLETED',
    medicalNotes: '',
    specialRequirements: '',
    photoUrl: null,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
  },
  {
    id: 'plg-6',
    organizationId: ORG,
    fullName: 'Suleiman Ahmed Kassim',
    arabicName: null,
    gender: 'MALE',
    dateOfBirth: '1995-03-08',
    nationality: 'KE',
    email: 'suleiman.k@example.com',
    phone: '+254 705 991 447',
    city: 'Nairobi',
    country: 'KE',
    emergencyContactName: 'Ahmed Kassim',
    emergencyContactPhone: '+254 706 112 889',
    emergencyContactRelation: 'Father',
    passportNumber: 'DK7719003',
    passportExpiry: '2031-08-15',
    visaStatus: 'NOT_STARTED',
    pilgrimageType: 'UMRAH',
    status: 'REGISTERED',
    medicalNotes: '',
    specialRequirements: '',
    photoUrl: null,
    createdAt: '2027-01-09T13:30:00Z',
    updatedAt: '2027-01-19T09:12:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Packages
// ─────────────────────────────────────────────────────────────────────────────

export const packages: TravelPackage[] = [
  {
    id: 'pkg-1',
    organizationId: ORG,
    name: 'Ramadan Umrah 2027',
    type: 'UMRAH',
    destination: 'Nairobi → Jeddah → Makkah → Madinah',
    departureDate: '2027-03-05',
    returnDate: '2027-03-19',
    durationDays: 14,
    pricePerPilgrim: 350000, // $3,500
    currency: 'USD',
    capacity: 45,
    depositAmount: 120000, // $1,200
    paymentDueDate: '2027-02-15',
    description:
      'Fourteen nights across Makkah and Madinah during the last two weeks of Ramadan, with an experienced Swahili and Arabic speaking guide.',
    inclusions: [
      'Return flights from Nairobi',
      'Umrah visa processing',
      '4-star hotel, 800m from Haram',
      'All ground transport in Saudi Arabia',
      'Daily breakfast and dinner',
      'Guide throughout',
    ],
    exclusions: ['Personal expenses', 'Travel insurance', 'Lunch', 'Excess baggage'],
    itinerary:
      'Day 1 Depart Nairobi · Day 2 Arrive Jeddah, transfer to Makkah · Days 3-9 Makkah, daily Haram programme · Day 10 Transfer to Madinah · Days 11-13 Madinah · Day 14 Return',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2027-01-10T10:30:00Z',
  },
  {
    id: 'pkg-2',
    organizationId: ORG,
    name: 'Hajj 2027 — Standard',
    type: 'HAJJ',
    destination: 'Nairobi → Jeddah → Makkah → Mina → Arafat → Madinah',
    departureDate: '2027-05-10',
    returnDate: '2027-06-08',
    durationDays: 29,
    pricePerPilgrim: 950000, // $9,500
    currency: 'USD',
    capacity: 30,
    depositAmount: 250000,
    paymentDueDate: '2027-03-31',
    description:
      'Full Hajj package including Mina tents, Arafat and Muzdalifah arrangements, and a full-time Kenyan guide.',
    inclusions: [
      'Return flights',
      'Hajj visa and permits',
      'Mina and Arafat tents',
      'Hotel in Makkah and Madinah',
      'All meals',
      'Full-time guide',
    ],
    exclusions: ['Qurbani', 'Personal expenses', 'Travel insurance'],
    itinerary:
      'Arrival and Makkah settlement · Mina 8th Dhul Hijjah · Arafat 9th · Muzdalifah · Jamarat days · Madinah · Return',
    status: 'ACTIVE',
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2027-01-05T11:00:00Z',
  },
  {
    id: 'pkg-3',
    organizationId: ORG,
    name: 'December Umrah 2026',
    type: 'UMRAH',
    destination: 'Nairobi → Jeddah → Makkah → Madinah',
    departureDate: '2026-12-18',
    returnDate: '2026-12-30',
    durationDays: 12,
    pricePerPilgrim: 295000,
    currency: 'USD',
    capacity: 40,
    depositAmount: 100000,
    paymentDueDate: '2026-11-30',
    description: 'School-holiday Umrah, popular with families.',
    inclusions: ['Return flights', 'Umrah visa', '3-star hotel', 'Ground transport', 'Breakfast'],
    exclusions: ['Lunch and dinner', 'Personal expenses', 'Travel insurance'],
    itinerary: 'Makkah 7 nights · Madinah 4 nights',
    status: 'COMPLETED',
    createdAt: '2026-07-20T08:00:00Z',
    updatedAt: '2027-01-02T09:00:00Z',
  },
  {
    id: 'pkg-4',
    organizationId: ORG,
    name: 'Shawwal Umrah 2027',
    type: 'UMRAH',
    destination: 'Nairobi → Jeddah → Makkah → Madinah',
    departureDate: '2027-04-12',
    returnDate: '2027-04-22',
    durationDays: 10,
    pricePerPilgrim: 285000,
    currency: 'USD',
    capacity: 35,
    depositAmount: 90000,
    paymentDueDate: '2027-03-20',
    description: 'Shorter, lower-cost Umrah just after Eid al-Fitr.',
    inclusions: ['Return flights', 'Umrah visa', '3-star hotel', 'Ground transport'],
    exclusions: ['Meals', 'Personal expenses', 'Travel insurance'],
    itinerary: 'Makkah 6 nights · Madinah 3 nights',
    status: 'DRAFT',
    createdAt: '2027-01-12T14:00:00Z',
    updatedAt: '2027-01-12T14:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Guides & Groups
// ─────────────────────────────────────────────────────────────────────────────

export const guides: Guide[] = [
  {
    id: 'gid-1',
    organizationId: ORG,
    fullName: 'Sheikh Abdirahman Yusuf',
    phone: '+254 700 123 456',
    email: 'abdirahman@barakatravels.co.ke',
    languages: ['Swahili', 'Arabic', 'English'],
  },
  {
    id: 'gid-2',
    organizationId: ORG,
    fullName: 'Ustadh Mohamed Salim',
    phone: '+254 711 987 654',
    email: 'mohamed@barakatravels.co.ke',
    languages: ['Swahili', 'Arabic'],
  },
];

export const groups: DepartureGroup[] = [
  {
    id: 'grp-1',
    organizationId: ORG,
    name: 'Ramadan Umrah — March 2027 — Group A',
    packageId: 'pkg-1',
    departureDate: '2027-03-05',
    returnDate: '2027-03-19',
    capacity: 25,
    guideId: 'gid-1',
    status: 'OPEN',
    meetingPoint: 'JKIA Terminal 1A, 4 hours before departure',
    itinerary: 'Coach from Jamia Mosque at 04:00 · Check-in 05:30 · Departure 09:15',
    hotelNotes: 'Elaf Ajyad, Makkah (7 nights) · Dar Al Iman InterContinental, Madinah (5 nights)',
    transportNotes: 'Private 30-seat coach for all Saudi transfers.',
    flightNotes: 'Kenya Airways KQ310 NBO→JED, 09:15. Return KQ311.',
    notes: 'Two wheelchair passengers — confirm airport assistance 72h before.',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2027-01-20T15:30:00Z',
  },
  {
    id: 'grp-2',
    organizationId: ORG,
    name: 'Ramadan Umrah — March 2027 — Group B',
    packageId: 'pkg-1',
    departureDate: '2027-03-12',
    returnDate: '2027-03-26',
    capacity: 20,
    guideId: null, // Unassigned — a readiness warning.
    status: 'PLANNING',
    meetingPoint: 'JKIA Terminal 1A',
    itinerary: 'To be confirmed',
    hotelNotes: 'Awaiting confirmation from Makkah supplier.',
    transportNotes: '',
    flightNotes: 'Holding 20 seats on KQ310, 12 March.',
    notes: 'Guide not yet assigned.',
    createdAt: '2026-12-05T10:00:00Z',
    updatedAt: '2027-01-15T09:00:00Z',
  },
  {
    id: 'grp-3',
    organizationId: ORG,
    name: 'December Umrah — Dec 2026 — Group A',
    packageId: 'pkg-3',
    departureDate: '2026-12-18',
    returnDate: '2026-12-30',
    capacity: 40,
    guideId: 'gid-2',
    status: 'COMPLETED',
    meetingPoint: 'JKIA Terminal 1A',
    itinerary: 'Completed',
    hotelNotes: 'Al Kiswah Towers, Makkah · Al Eiman Taibah, Madinah',
    transportNotes: 'Completed',
    flightNotes: 'KQ310 / KQ311',
    notes: 'Trip completed without incident.',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2027-01-02T09:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bookings → Invoices → Payments
// ─────────────────────────────────────────────────────────────────────────────

export const bookings: Booking[] = [
  {
    id: 'bkg-1',
    organizationId: ORG,
    reference: 'BK-2027-0041',
    pilgrimId: 'plg-1',
    packageId: 'pkg-1',
    bookingDate: '2026-11-02',
    packagePrice: 350000,
    discount: 0,
    status: 'CONFIRMED',
    groupId: 'grp-1',
    notes: '',
    createdAt: '2026-11-02T09:20:00Z',
    updatedAt: '2027-01-18T14:22:00Z',
  },
  {
    id: 'bkg-2',
    organizationId: ORG,
    reference: 'BK-2027-0042',
    pilgrimId: 'plg-2',
    packageId: 'pkg-1',
    bookingDate: '2026-11-08',
    packagePrice: 350000,
    discount: 15000, // Family discount — booked with her mother.
    status: 'CONFIRMED',
    groupId: 'grp-1',
    notes: 'Family discount applied — booked alongside her mother.',
    createdAt: '2026-11-08T11:45:00Z',
    updatedAt: '2027-01-20T08:05:00Z',
  },
  {
    id: 'bkg-3',
    organizationId: ORG,
    reference: 'BK-2027-0043',
    pilgrimId: 'plg-3',
    packageId: 'pkg-1',
    bookingDate: '2026-11-08',
    packagePrice: 350000,
    discount: 15000,
    status: 'CONFIRMED',
    groupId: 'grp-1',
    notes: 'Family discount applied.',
    createdAt: '2026-11-08T11:55:00Z',
    updatedAt: '2027-01-20T08:06:00Z',
  },
  {
    id: 'bkg-4',
    organizationId: ORG,
    reference: 'BK-2027-0051',
    pilgrimId: 'plg-6',
    packageId: 'pkg-1',
    bookingDate: '2027-01-09',
    packagePrice: 350000,
    discount: 0,
    status: 'PENDING',
    groupId: null, // Not yet assigned to a departure.
    notes: 'Awaiting deposit before confirming.',
    createdAt: '2027-01-09T13:35:00Z',
    updatedAt: '2027-01-09T13:35:00Z',
  },
  {
    id: 'bkg-5',
    organizationId: ORG,
    reference: 'BK-2026-0018',
    pilgrimId: 'plg-5',
    packageId: 'pkg-3',
    bookingDate: '2026-06-01',
    packagePrice: 295000,
    discount: 0,
    status: 'COMPLETED',
    groupId: 'grp-3',
    notes: '',
    createdAt: '2026-06-01T10:05:00Z',
    updatedAt: '2027-01-02T09:00:00Z',
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    organizationId: ORG,
    number: 'INV-2027-0041',
    bookingId: 'bkg-1',
    total: 350000,
    currency: 'USD',
    dueDate: '2027-02-15',
    createdAt: '2026-11-02T09:20:00Z',
  },
  {
    id: 'inv-2',
    organizationId: ORG,
    number: 'INV-2027-0042',
    bookingId: 'bkg-2',
    total: 335000,
    currency: 'USD',
    dueDate: '2027-02-15',
    createdAt: '2026-11-08T11:45:00Z',
  },
  {
    id: 'inv-3',
    organizationId: ORG,
    number: 'INV-2027-0043',
    bookingId: 'bkg-3',
    total: 335000,
    currency: 'USD',
    // Already past — this one renders as OVERDUE.
    dueDate: '2027-01-15',
    createdAt: '2026-11-08T11:55:00Z',
  },
  {
    id: 'inv-4',
    organizationId: ORG,
    number: 'INV-2027-0051',
    bookingId: 'bkg-4',
    total: 350000,
    currency: 'USD',
    dueDate: '2027-02-15',
    createdAt: '2027-01-09T13:35:00Z',
  },
  {
    id: 'inv-5',
    organizationId: ORG,
    number: 'INV-2026-0018',
    bookingId: 'bkg-5',
    total: 295000,
    currency: 'USD',
    dueDate: '2026-11-30',
    createdAt: '2026-06-01T10:05:00Z',
  },
];

/**
 * Payment records.
 *
 * <p>Chosen so every invoice status is represented once the helpers derive it:
 * inv-1 partially paid, inv-2 fully paid, inv-3 overdue with a part payment,
 * inv-4 unpaid, inv-5 paid in full.
 */
export const payments: Payment[] = [
  {
    id: 'pmt-1',
    organizationId: ORG,
    reference: 'PMT-2027-0101',
    invoiceId: 'inv-1',
    amount: 120000,
    paymentDate: '2026-11-02',
    method: 'MPESA',
    externalReference: 'SJK4H7QW2P',
    receiptUrl: null,
    recordedBy: 'Fatima (Finance)',
    note: 'Deposit',
    createdAt: '2026-11-02T09:30:00Z',
  },
  {
    id: 'pmt-2',
    organizationId: ORG,
    reference: 'PMT-2027-0118',
    invoiceId: 'inv-1',
    amount: 80000,
    paymentDate: '2027-01-18',
    method: 'BANK_TRANSFER',
    externalReference: 'FT27018994210',
    receiptUrl: null,
    recordedBy: 'Fatima (Finance)',
    note: 'Second installment',
    createdAt: '2027-01-18T14:20:00Z',
  },
  {
    id: 'pmt-3',
    organizationId: ORG,
    reference: 'PMT-2027-0102',
    invoiceId: 'inv-2',
    amount: 335000,
    paymentDate: '2026-11-20',
    method: 'BANK_TRANSFER',
    externalReference: 'FT26112033871',
    receiptUrl: null,
    recordedBy: 'Fatima (Finance)',
    note: 'Paid in full',
    createdAt: '2026-11-20T10:15:00Z',
  },
  {
    id: 'pmt-4',
    organizationId: ORG,
    reference: 'PMT-2027-0103',
    invoiceId: 'inv-3',
    amount: 100000,
    paymentDate: '2026-11-20',
    method: 'MPESA',
    externalReference: 'SJL9M2XT4R',
    receiptUrl: null,
    recordedBy: 'Fatima (Finance)',
    note: 'Deposit only',
    createdAt: '2026-11-20T10:20:00Z',
  },
  {
    id: 'pmt-5',
    organizationId: ORG,
    reference: 'PMT-2026-0044',
    invoiceId: 'inv-5',
    amount: 295000,
    paymentDate: '2026-10-15',
    method: 'CASH',
    externalReference: null,
    receiptUrl: null,
    recordedBy: 'Fatima (Finance)',
    note: 'Settled before departure',
    createdAt: '2026-10-15T12:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export const documents: PilgrimDocument[] = [
  // plg-1 — fully ready
  d('doc-1', 'plg-1', 'PASSPORT', 'APPROVED', '2029-06-30', '2026-11-03T10:00:00Z'),
  d('doc-2', 'plg-1', 'PASSPORT_PHOTO', 'APPROVED', null, '2026-11-03T10:05:00Z'),
  d('doc-3', 'plg-1', 'VISA', 'APPROVED', '2027-04-30', '2027-01-10T09:00:00Z'),
  d('doc-4', 'plg-1', 'VACCINATION', 'APPROVED', '2029-01-01', '2026-11-12T08:30:00Z'),
  d('doc-5', 'plg-1', 'INSURANCE', 'APPROVED', '2027-03-31', '2026-12-01T14:00:00Z'),
  d('doc-6', 'plg-1', 'CONTRACT', 'APPROVED', null, '2026-11-03T10:10:00Z'),

  // plg-2 — passport expiring before return, visa still pending
  d('doc-7', 'plg-2', 'PASSPORT', 'APPROVED', '2027-03-14', '2026-11-09T09:00:00Z'),
  d('doc-8', 'plg-2', 'PASSPORT_PHOTO', 'APPROVED', null, '2026-11-09T09:05:00Z'),
  d('doc-9', 'plg-2', 'VISA', 'UNDER_REVIEW', null, '2027-01-16T11:00:00Z'),
  d('doc-10', 'plg-2', 'VACCINATION', 'APPROVED', '2030-02-01', '2026-11-15T10:00:00Z'),
  d('doc-11', 'plg-2', 'INSURANCE', 'MISSING', null, null),
  d('doc-12', 'plg-2', 'CONTRACT', 'APPROVED', null, '2026-11-09T09:10:00Z'),

  // plg-3 — rejected photo, blocks the group
  d('doc-13', 'plg-3', 'PASSPORT', 'APPROVED', '2028-11-02', '2026-11-09T09:20:00Z'),
  d('doc-14', 'plg-3', 'PASSPORT_PHOTO', 'REJECTED', null, '2026-11-09T09:25:00Z'),
  d('doc-15', 'plg-3', 'VISA', 'UNDER_REVIEW', null, '2027-01-16T11:05:00Z'),
  d('doc-16', 'plg-3', 'VACCINATION', 'APPROVED', '2029-05-01', '2026-11-15T10:10:00Z'),
  d('doc-17', 'plg-3', 'INSURANCE', 'MISSING', null, null),
  d('doc-18', 'plg-3', 'CONTRACT', 'APPROVED', null, '2026-11-09T09:30:00Z'),

  // plg-6 — only just registered
  d('doc-19', 'plg-6', 'PASSPORT', 'UPLOADED', '2031-08-15', '2027-01-19T09:10:00Z'),
  d('doc-20', 'plg-6', 'PASSPORT_PHOTO', 'MISSING', null, null),
  d('doc-21', 'plg-6', 'VISA', 'MISSING', null, null),
  d('doc-22', 'plg-6', 'VACCINATION', 'MISSING', null, null),
  d('doc-23', 'plg-6', 'INSURANCE', 'MISSING', null, null),
  d('doc-24', 'plg-6', 'CONTRACT', 'MISSING', null, null),

  // plg-5 — completed trip
  d('doc-25', 'plg-5', 'PASSPORT', 'APPROVED', '2030-01-22', '2026-06-05T09:00:00Z'),
  d('doc-26', 'plg-5', 'VISA', 'EXPIRED', '2027-01-05', '2026-10-01T09:00:00Z'),
];

/** Compact constructor — 26 documents written longhand is unreadable. */
function d(
  id: string,
  pilgrimId: string,
  type: PilgrimDocument['type'],
  status: PilgrimDocument['status'],
  expiryDate: string | null,
  uploadedAt: string | null,
): PilgrimDocument {
  return {
    id,
    organizationId: ORG,
    pilgrimId,
    type,
    status,
    fileUrl: uploadedAt ? `/mock/${id}.pdf` : null,
    expiryDate,
    uploadedAt,
    reviewedBy: status === 'APPROVED' || status === 'REJECTED' ? 'Operations' : null,
    reviewedAt: status === 'APPROVED' || status === 'REJECTED' ? uploadedAt : null,
    note: status === 'REJECTED' ? 'Photo does not meet the white-background requirement.' : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity feed
// ─────────────────────────────────────────────────────────────────────────────

export const activities: Activity[] = [
  a('act-1', 'PAYMENT_RECORDED', 'Payment of $800 recorded for Ahmed Hassan Mohamed', 'Fatima', '/payments', '2027-01-18T14:20:00Z'),
  a('act-2', 'DOCUMENT_UPLOADED', 'Visa application submitted for Amina Yusuf Abdi', 'Operations', '/documents', '2027-01-16T11:00:00Z'),
  a('act-3', 'DOCUMENT_UPLOADED', 'Passport uploaded for Suleiman Ahmed Kassim', 'Operations', '/documents', '2027-01-19T09:10:00Z'),
  a('act-4', 'PILGRIM_ADDED', 'Ibrahim Omar Farah added as a lead for Hajj 2027', 'Sales', '/pilgrims', '2027-01-14T16:20:00Z'),
  a('act-5', 'BOOKING_CREATED', 'Booking BK-2027-0051 created for Suleiman Ahmed Kassim', 'Sales', '/bookings', '2027-01-09T13:35:00Z'),
  a('act-6', 'PILGRIM_ASSIGNED_TO_GROUP', 'Halima Yusuf Abdi assigned to Ramadan Umrah — Group A', 'Operations', '/groups', '2027-01-20T08:06:00Z'),
];

function a(
  id: string,
  type: Activity['type'],
  summary: string,
  actorName: string,
  href: string,
  createdAt: string,
): Activity {
  return { id, organizationId: ORG, type, summary, actorName, href, createdAt };
}
