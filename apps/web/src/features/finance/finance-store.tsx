'use client';

import * as React from 'react';

import { formatDateToString } from '@/lib/data-grid';

import { SAMPLE_EXPENSES, type Expense } from './expenses-data';
import {
  describeService,
  nextNumber,
  SAMPLE_INVOICES,
  SAMPLE_QUOTATIONS,
  SAMPLE_RECEIPTS,
  type Invoice,
  type PaymentMethod,
  type Quotation,
  type Receipt,
} from './finance-data';

interface FinanceState {
  quotations: Quotation[];
  invoices: Invoice[];
  receipts: Receipt[];
  expenses: Expense[];
}

/** What the customer asked for; the number, date and id are filled in. */
export type NewQuotation = Pick<Quotation, 'client' | 'phone' | 'service' | 'details' | 'currency' | 'amount'>;

/** Expenses taken out, with where they were — enough to put them back. */
export type RemovedExpenses = { expense: Expense; index: number }[];

interface FinanceStore extends FinanceState {
  addQuotation: (quotation: NewQuotation) => Quotation;
  /** The customer went ahead: invoice the quotation (once). */
  invoiceQuotation: (quotationId: string) => Invoice | null;
  confirmPayment: (invoiceId: string, method: PaymentMethod) => void;
  /** The receipt for a paid invoice — printed now, or the one printed before. */
  issueReceipt: (invoiceId: string) => Receipt | null;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpenses: (ids: string[]) => RemovedExpenses;
  /** Undo for removeExpenses: each expense goes back where it was. */
  restoreExpenses: (removed: RemovedExpenses) => void;
}

const FinanceContext = React.createContext<FinanceStore | null>(null);

const today = () => formatDateToString(new Date());

/**
 * Holds the Finance pages' records — quotations, invoices, receipts and
 * expenses — so a quotation, its invoice and its receipt stay linked as you move
 * between them. In memory for now — a page refresh starts over from the samples.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<FinanceState>({
    quotations: SAMPLE_QUOTATIONS,
    invoices: SAMPLE_INVOICES,
    receipts: SAMPLE_RECEIPTS,
    expenses: SAMPLE_EXPENSES,
  });

  // Each action works from the state it was rendered with and returns what it
  // created, so the page can name it in a toast straight away.

  const addQuotation = (input: NewQuotation) => {
    const quotation: Quotation = {
      ...input,
      id: crypto.randomUUID(),
      number: nextNumber('QT', state.quotations),
      date: today(),
      invoiceId: null,
    };
    setState((current) => ({ ...current, quotations: [quotation, ...current.quotations] }));
    return quotation;
  };

  const invoiceQuotation = (quotationId: string) => {
    const quotation = state.quotations.find(({ id }) => id === quotationId);
    if (!quotation || quotation.invoiceId) return null;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      number: nextNumber('INV', state.invoices),
      date: today(),
      quotationId: quotation.id,
      quotationNumber: quotation.number,
      client: quotation.client,
      phone: quotation.phone,
      service: quotation.service,
      description: describeService(quotation.service, quotation.details),
      currency: quotation.currency,
      amount: quotation.amount,
      paidOn: null,
      method: null,
      receiptId: null,
    };
    setState((current) => ({
      ...current,
      invoices: [invoice, ...current.invoices],
      quotations: current.quotations.map((existing) =>
        existing.id === quotationId ? { ...existing, invoiceId: invoice.id } : existing,
      ),
    }));
    return invoice;
  };

  const confirmPayment = (invoiceId: string, method: PaymentMethod) => {
    setState((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) =>
        invoice.id === invoiceId && !invoice.paidOn ? { ...invoice, paidOn: today(), method } : invoice,
      ),
    }));
  };

  const issueReceipt = (invoiceId: string) => {
    const invoice = state.invoices.find(({ id }) => id === invoiceId);
    if (!invoice || !invoice.paidOn) return null;
    if (invoice.receiptId) {
      return state.receipts.find(({ id }) => id === invoice.receiptId) ?? null;
    }

    const receipt: Receipt = {
      id: crypto.randomUUID(),
      number: nextNumber('RC', state.receipts),
      date: today(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      quotationNumber: invoice.quotationNumber,
      client: invoice.client,
      phone: invoice.phone,
      service: invoice.service,
      description: invoice.description,
      currency: invoice.currency,
      amount: invoice.amount,
      method: invoice.method,
    };
    setState((current) => ({
      ...current,
      receipts: [receipt, ...current.receipts],
      invoices: current.invoices.map((existing) =>
        existing.id === invoiceId ? { ...existing, receiptId: receipt.id } : existing,
      ),
    }));
    return receipt;
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setState((current) => ({ ...current, expenses: [{ ...expense, id: crypto.randomUUID() }, ...current.expenses] }));
  };

  const removeExpenses = (ids: string[]) => {
    const idSet = new Set(ids);
    const removed = state.expenses.flatMap((expense, index) => (idSet.has(expense.id) ? [{ expense, index }] : []));
    setState((current) => ({ ...current, expenses: current.expenses.filter(({ id }) => !idSet.has(id)) }));
    return removed;
  };

  const restoreExpenses = (removed: RemovedExpenses) => {
    setState((current) => {
      const expenses = [...current.expenses];
      // Ascending original positions, so each insert lands where it was.
      for (const { expense, index } of removed) {
        if (!expenses.some(({ id }) => id === expense.id)) {
          expenses.splice(Math.min(index, expenses.length), 0, expense);
        }
      }
      return { ...current, expenses };
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        ...state,
        addQuotation,
        invoiceQuotation,
        confirmPayment,
        issueReceipt,
        addExpense,
        removeExpenses,
        restoreExpenses,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceStore {
  const store = React.useContext(FinanceContext);
  if (!store) {
    throw new Error('useFinance must be used inside <FinanceProvider> (app/workspace/finance/layout.tsx).');
  }
  return store;
}
