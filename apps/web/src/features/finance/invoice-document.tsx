'use client';

import { format, parse } from 'date-fns';
import { Marcellus } from 'next/font/google';

import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

import { AGENCY, AGENCY_INITIALS } from './agency';
import { paymentMethodLabel, serviceLabel, type Invoice } from './finance-data';

// The big "INVOICE" title — a wide classic serif, like the reference.
const titleFont = Marcellus({ subsets: ['latin'], weight: '400' });

/** "2026-09-16" → "16 September, 2026". */
function longDate(value: string): string {
  return format(parse(value, 'yyyy-MM-dd', new Date()), 'd MMMM, yyyy');
}

function money(value: number | null): string {
  return `${AGENCY.currency} ${formatAmount(value)}`;
}

/**
 * An invoice as a printed A4 page: the agency and the big INVOICE title up top,
 * who it's billed to, the line items, and how to pay — over the plane in
 * public/invoice.png. Always black on white, like paper; `.print-area` and
 * `.invoice-page` (globals.css) make it print as exactly one A4 page.
 */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  // One line per invoice for now — the service quoted. Quantity is always 1.
  const lines = [
    {
      description: serviceLabel(invoice.service),
      detail: invoice.description,
      price: invoice.amount,
      quantity: 1,
    },
  ];

  return (
    <article
      className="invoice-page print-area relative flex h-[297mm] w-[210mm] shrink-0 flex-col overflow-hidden bg-white px-[20mm] pt-[18mm] text-neutral-900"
      style={{ backgroundImage: 'url(/invoice.png)', backgroundSize: '100% 100%' }}
    >
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="text-[13px] font-bold tracking-wide uppercase">{AGENCY.name}</p>
          <p className="text-[10px] text-neutral-600">{AGENCY.address}</p>
          <h1 className={cn(titleFont.className, 'mt-[10mm] text-[64px] leading-none text-[#10bfe0]')}>INVOICE</h1>
        </div>

        <div className="flex flex-col items-end gap-[6mm]">
          {AGENCY.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- a plain img prints reliably
            <img src={AGENCY.logo} alt="" className="size-[28mm] rounded-2xl bg-white object-contain p-2 shadow-sm" />
          ) : (
            <div
              className={cn(
                titleFont.className,
                'flex size-[28mm] items-center justify-center rounded-2xl bg-[#10bfe0] text-[30px] text-white',
              )}
            >
              {AGENCY_INITIALS}
            </div>
          )}
          <dl className="grid grid-cols-[auto_auto] gap-x-2 text-right text-[13px]">
            <dt>Invoice Number :</dt>
            <dd className="text-left font-medium">{invoice.number}</dd>
            <dt>Date :</dt>
            <dd className="text-left">{longDate(invoice.date)}</dd>
            <dt>Quotation :</dt>
            <dd className="text-left">{invoice.quotationNumber}</dd>
          </dl>
        </div>
      </header>

      <section className="mt-[30mm] text-[14px] leading-relaxed">
        <p className="font-bold">Billed to:</p>
        <p>{invoice.client}</p>
        {invoice.phone ? <p>{invoice.phone}</p> : null}
      </section>

      <table className="mt-[14mm] w-full border-collapse text-[14px]">
        <thead>
          <tr className="bg-[#10bfe0] font-bold">
            <th className="h-[12mm] px-4 text-left">Description</th>
            <th className="px-4 text-right">Price</th>
            <th className="px-4 text-center">Quantity</th>
            <th className="px-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.description}>
              <td className="px-4 pt-5 pb-2 align-top">
                <p>{line.description}</p>
                {line.detail ? <p className="text-[12px] text-neutral-600">{line.detail}</p> : null}
              </td>
              <td className="px-4 pt-5 text-right align-top tabular-nums">{money(line.price)}</td>
              <td className="px-4 pt-5 text-center align-top tabular-nums">{line.quantity}</td>
              <td className="px-4 pt-5 text-right align-top tabular-nums">
                {money(line.price === null ? null : line.price * line.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-6" />
          </tr>
          <tr className="border-y border-[#4db8a7]">
            <td colSpan={2} />
            <td className="h-[12mm] px-4 text-center font-bold">Total</td>
            <td className="px-4 text-right font-bold tabular-nums">{money(invoice.amount)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.paidOn ? (
        <p className="mt-4 self-end text-[12px] font-medium text-[#0a8f7a]">
          Paid on {longDate(invoice.paidOn)} by {paymentMethodLabel(invoice.method)}
        </p>
      ) : null}

      <footer className="mt-auto grid grid-cols-2 gap-8 pb-[14mm] text-[14px] leading-relaxed">
        <div>
          <p className="font-bold">Payment Detail:</p>
          <p>Bank: {AGENCY.bank.name}</p>
          <p>Account Name: {AGENCY.bank.accountName}</p>
          <p>Account Number : {AGENCY.bank.accountNumber}</p>
        </div>
        <div className="justify-self-end">
          <p className="font-bold">{AGENCY.name}</p>
          <p>{AGENCY.phone}</p>
          <p>{AGENCY.email}</p>
          <p>{AGENCY.website}</p>
        </div>
      </footer>

      {/* The band along the bottom edge. */}
      <div className="h-[6mm] bg-[#10bfe0]" />
    </article>
  );
}
