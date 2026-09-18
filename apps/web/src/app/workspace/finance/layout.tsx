import { FinanceProvider } from '@/features/finance/finance-store';

/** Quotations, invoices and receipts share one store, so the three pages stay linked. */
export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <FinanceProvider>{children}</FinanceProvider>;
}
