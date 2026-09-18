'use client';

import { gooeyToast } from 'goey-toast';
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon, PrinterIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { WORKSPACE_PATH } from '@/features/workspace/navigation';

import { StatusPill } from './finance-parts';
import { useFinance } from './finance-store';
import { QuotationDocument } from './quotation-document';

const QUOTATIONS_PATH = `${WORKSPACE_PATH}/finance/quotations`;
const INVOICES_PATH = `${WORKSPACE_PATH}/finance/invoices`;

function BackToQuotations() {
  return (
    <Button variant="outline" size="lg" nativeButton={false} render={<Link href={QUOTATIONS_PATH} />}>
      <ArrowLeftIcon />
      Quotations
    </Button>
  );
}

/**
 * One quotation as its A4 page, to print or save as a PDF for the customer.
 * When they go ahead, Create invoice is right here.
 */
export function QuotationView({ quotationId }: { quotationId: string }) {
  const { quotations, invoiceQuotation } = useFinance();
  const router = useRouter();
  const quotation = quotations.find(({ id }) => id === quotationId);

  if (!quotation) {
    return (
      <div className="flex flex-col items-start gap-4">
        <BackToQuotations />
        <p className="text-muted-foreground text-sm">
          This quotation isn&apos;t here. Quotations are kept in memory for now, so a page refresh loses any created
          since — they&apos;ll stay once the database is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackToQuotations />
          <h2 className="text-foreground font-mono text-xl font-semibold">{quotation.number}</h2>
          {quotation.invoiceId ? <StatusPill tone="green">Invoiced</StatusPill> : <StatusPill tone="amber">Open</StatusPill>}
        </div>
        <div className="flex items-center gap-2">
          {quotation.invoiceId ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`${INVOICES_PATH}/${quotation.invoiceId}`)}
            >
              View invoice
              <ArrowRightIcon />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const invoice = invoiceQuotation(quotation.id);
                if (!invoice) return;
                gooeyToast.success(`Invoice ${invoice.number} created`, {
                  description: `From ${quotation.number} for ${quotation.client}.`,
                });
                router.push(`${INVOICES_PATH}/${invoice.id}`);
              }}
            >
              <FileTextIcon />
              Create invoice
            </Button>
          )}
          <Button size="lg" onClick={() => window.print()}>
            <PrinterIcon />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* The page at its real size; scrolls sideways on narrow screens. */}
      <div className="scrollbar-pill overflow-x-auto pb-2">
        <div className="mx-auto w-fit rounded-sm shadow-lg ring-1 ring-black/5">
          <QuotationDocument quotation={quotation} />
        </div>
      </div>
    </div>
  );
}
