import { formatAmount } from './format';

/** The currencies an amount can be in. Each record (ticket, visa…) has one. */
export type Currency = 'USD' | 'KES';

export const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'USD', label: 'USD' },
  { id: 'KES', label: 'KSh' },
];

export function currencyLabel(currency: Currency): string {
  return CURRENCIES.find((option) => option.id === currency)?.label ?? currency;
}

/**
 * The amount, then its currency — the way the amount fields read:
 * 780 in USD → "780.00 USD"; 78000 in KES → "78,000.00 KSh"; nothing → "—".
 */
export function formatMoney(value: number | null, currency: Currency): string {
  return value === null ? '—' : `${formatAmount(value)} ${currencyLabel(currency)}`;
}

/**
 * Adds amounts up per currency — USD and KSh never mix:
 * "1,200.00 USD · 12,000.00 KSh". Nothing to add → "—".
 */
export function formatTotals(items: { amount: number | null; currency: Currency }[]): string {
  const totals = new Map<Currency, number>();
  for (const { amount, currency } of items) {
    if (amount === null) continue;
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  if (totals.size === 0) return '—';
  return CURRENCIES.filter(({ id }) => totals.has(id))
    .map(({ id }) => formatMoney(totals.get(id) ?? 0, id))
    .join(' · ');
}
