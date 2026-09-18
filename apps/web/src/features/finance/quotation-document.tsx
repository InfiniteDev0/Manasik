'use client';

import { addDays, format, parse } from 'date-fns';

import { AGENCY } from './agency';
import { DocumentPage, longDate } from './document-page';
import { serviceDetailLines, serviceLabel, type Quotation } from './finance-data';

/** The day the quotation's price stops holding, `yyyy-mm-dd`. */
function validUntil(quotation: Quotation): string {
  return format(addDays(parse(quotation.date, 'yyyy-MM-dd', new Date()), AGENCY.quotationValidDays), 'yyyy-MM-dd');
}

/**
 * A quotation as its printed A4 page — the same design as the invoice, with
 * what a quotation needs instead: how long the price holds, each detail of the
 * service on its own line, and a note on what happens next.
 */
export function QuotationDocument({ quotation }: { quotation: Quotation }) {
  return (
    <DocumentPage
      title="QUOTATION"
      meta={[
        ['Quotation Number', quotation.number],
        ['Date', longDate(quotation.date)],
        ['Valid until', longDate(validUntil(quotation))],
      ]}
      recipientLabel="Prepared for"
      recipient={{ name: quotation.client, phone: quotation.phone }}
      lines={[
        {
          description: serviceLabel(quotation.service),
          details: serviceDetailLines(quotation.service, quotation.details),
          price: quotation.amount,
          quantity: 1,
        },
      ]}
      total={quotation.amount}
    >
      <div className="mt-[8mm] space-y-1 text-[12px] leading-relaxed text-neutral-600">
        <p className="font-bold text-neutral-900">Terms:</p>
        <p>This price holds until {longDate(validUntil(quotation))}. Seats, rooms and visa slots are subject to availability when booked.</p>
        <p>To go ahead, contact us and we&apos;ll send your invoice.</p>
      </div>
    </DocumentPage>
  );
}
