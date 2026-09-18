'use client';

import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { WORKSPACE_PATH } from '@/features/workspace/navigation';

import { StatusPill } from './finance-parts';
import { useFinance } from './finance-store';
import { InvoiceDocument } from './invoice-document';

const INVOICES_PATH = `${WORKSPACE_PATH}/finance/invoices`;

function BackToInvoices() {
  return (
    <Button variant="outline" size="lg" nativeButton={false} render={<Link href={INVOICES_PATH} />}>
      <ArrowLeftIcon />
      Invoices
    </Button>
  );
}

/**
 * One invoice as its A4 page. Print sends just the page to the printer — choose
 * "Save as PDF" there to get the PDF.
 */
export function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const { invoices } = useFinance();
  const invoice = invoices.find(({ id }) => id === invoiceId);

  if (!invoice) {
    return (
      <div className="flex flex-col items-start gap-4">
        <BackToInvoices />
        <p className="text-muted-foreground text-sm">
          This invoice isn&apos;t here. Invoices are kept in memory for now, so a page refresh loses any created
          since — they&apos;ll stay once the database is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackToInvoices />
          <h2 className="text-foreground font-mono text-xl font-semibold">{invoice.number}</h2>
          {invoice.paidOn ? <StatusPill tone="green">Paid</StatusPill> : <StatusPill tone="amber">Unpaid</StatusPill>}
        </div>
        <Button size="lg" onClick={() => window.print()}>
          <PrinterIcon />
          Print / Save as PDF
        </Button>
      </div>

      {/* The page at its real size; scrolls sideways on narrow screens. */}
      <div className="scrollbar-pill overflow-x-auto pb-2">
        <div className="mx-auto w-fit rounded-sm shadow-lg ring-1 ring-black/5">
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
