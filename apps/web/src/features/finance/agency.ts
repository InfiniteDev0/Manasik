/**
 * The agency's own details, printed on invoices and receipts.
 *
 * The name and website are the agency's; the rest are PLACEHOLDERS — replace
 * them with the real ones (they'll move to Settings once there's a database to
 * keep them in).
 */
export const AGENCY = {
  name: 'Tokio Travel Solutions',
  address: 'Nairobi, Kenya',
  phone: '+254 700 000 000',
  email: 'info@tokiotravel.co.ke',
  website: 'www.tokiotravel.co.ke',
  /** An image in /public for the invoice's top corner; null shows the initials instead. */
  logo: '/mansiklogoblack.png' as string | null,
  /** Shown in front of invoice and receipt totals. */
  currency: 'USD',
  /** The line in italics near the bottom of a receipt. */
  receiptNote: 'Safe travels — may your journey be blessed.',
  bank: {
    name: 'Bank name',
    accountName: 'Tokio Travel Solutions',
    accountNumber: '0000 0000 0000',
  },
};

/** "Tokio Travel Solutions" → "TTS". */
export const AGENCY_INITIALS = AGENCY.name
  .split(/\s+/)
  .map((word) => word.charAt(0).toUpperCase())
  .join('');
