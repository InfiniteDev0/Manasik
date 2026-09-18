import type { PaymentMethod } from './finance-data';

// The agency's running costs — what it spends to operate, not what it pays
// airlines or embassies for a customer (that's already in each ticket's and
// visa's net amount).

export type ExpenseCategory = 'rent' | 'salaries' | 'marketing' | 'transport' | 'office' | 'other';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'rent', label: 'Rent & utilities' },
  { id: 'salaries', label: 'Salaries' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'transport', label: 'Transport' },
  { id: 'office', label: 'Office' },
  { id: 'other', label: 'Other' },
];

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((option) => option.id === category)?.label ?? category;
}

/** Money the agency spent. `date` is the day it was paid, `yyyy-mm-dd`. */
export interface Expense {
  id: string;
  date: string;
  /** What it was for: "Office rent — September". */
  description: string;
  category: ExpenseCategory;
  /** Who was paid: the landlord, Safaricom, a driver… */
  payee: string;
  amount: number | null;
  method: PaymentMethod;
  /** The M-Pesa code, bank reference or receipt number, to find it again. */
  reference: string;
}

// Placeholder rows so the page has something to show. Not saved anywhere yet.
// Fixed ids and dates, so the server and the browser render the same.
export const SAMPLE_EXPENSES: Expense[] = [
  { id: 'exp-1', date: '2026-09-01', description: 'Office rent — September', category: 'rent', payee: 'Eastleigh Properties', amount: 1200, method: 'bank', reference: 'TRF-88213' },
  { id: 'exp-2', date: '2026-09-02', description: 'Internet', category: 'rent', payee: 'Safaricom', amount: 60, method: 'mpesa', reference: 'SIK4Q2LM7P' },
  { id: 'exp-3', date: '2026-09-05', description: 'Umrah season ads', category: 'marketing', payee: 'Meta', amount: 150, method: 'card', reference: '' },
  { id: 'exp-4', date: '2026-09-10', description: 'Taxi to the Saudi embassy', category: 'transport', payee: 'Driver', amount: 25, method: 'cash', reference: '' },
  { id: 'exp-5', date: '2026-09-12', description: 'Printer paper and ink', category: 'office', payee: 'Text Book Centre', amount: 42, method: 'mpesa', reference: 'SIL1B9XK2D' },
];
