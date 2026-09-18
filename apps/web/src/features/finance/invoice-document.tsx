'use client';

import { DocumentPage, longDate } from './document-page';
import { paymentMethodLabel, serviceLabel, type Invoice } from './finance-data';

/** An invoice as its printed A4 page. */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  return (
    <DocumentPage
      title="INVOICE"
      meta={[
        ['Invoice Number', invoice.number],
        ['Date', longDate(invoice.date)],
        ['Quotation', invoice.quotationNumber],
      ]}
      recipientLabel="Billed to"
      recipient={{ name: invoice.client, phone: invoice.phone }}
      // One line per invoice for now — the service quoted. Quantity is always 1.
      lines={[
        {
          description: serviceLabel(invoice.service),
          details: invoice.description ? [invoice.description] : [],
          price: invoice.amount,
          quantity: 1,
        },
      ]}
      total={invoice.amount}
      currency={invoice.currency}
    >
      {invoice.paidOn ? (
        <p className="mt-4 self-end text-[12px] font-medium text-[#0a8f7a]">
          Paid on {longDate(invoice.paidOn)} by {paymentMethodLabel(invoice.method)}
        </p>
      ) : null}
    </DocumentPage>
  );
}
