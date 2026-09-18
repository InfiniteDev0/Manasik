'use client';

import { format, parse } from 'date-fns';
import { Marcellus } from 'next/font/google';
import type * as React from 'react';

import { formatMoney, type Currency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import { AGENCY, AGENCY_INITIALS } from './agency';

// The big title (INVOICE, QUOTATION) — a wide classic serif, like the reference.
const titleFont = Marcellus({ subsets: ['latin'], weight: '400' });

/** "2026-09-16" → "16 September, 2026". */
export function longDate(value: string): string {
  return format(parse(value, 'yyyy-MM-dd', new Date()), 'd MMMM, yyyy');
}

export interface DocumentLine {
  description: string;
  /** Smaller lines under the description: "Airline: Qatar Airways"… */
  details: string[];
  price: number | null;
  quantity: number;
}

interface DocumentPageProps {
  /** INVOICE, QUOTATION */
  title: string;
  /** The rows under the logo: [label, value]. The first one is bold. */
  meta: [string, string][];
  /** "Billed to", "Prepared for" */
  recipientLabel: string;
  recipient: { name: string; phone: string };
  lines: DocumentLine[];
  total: number | null;
  /** What every amount on the page is in. */
  currency: Currency;
  /** Anything under the table — a paid note, the quotation's terms. */
  children?: React.ReactNode;
}

/**
 * A finance document as a printed A4 page, laid out like the invoice reference:
 * the agency and a big title up top, who it's for, the line items and total,
 * and how to pay — over the plane in public/invoice.png. Always black on white,
 * like paper; `.print-area` and `.document-page` (globals.css) make it print as
 * exactly one A4 page.
 */
export function DocumentPage({
  title,
  meta,
  recipientLabel,
  recipient,
  lines,
  total,
  currency,
  children,
}: DocumentPageProps) {
  return (
    <article
      className="document-page print-area relative flex h-[297mm] w-[210mm] shrink-0 flex-col overflow-hidden bg-white px-[20mm] pt-[18mm] text-neutral-900"
      style={{ backgroundImage: 'url(/invoice.png)', backgroundSize: '100% 100%' }}
    >
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="text-[13px] font-bold tracking-wide uppercase">{AGENCY.name}</p>
          <p className="text-[10px] text-neutral-600">{AGENCY.address}</p>
          <h1
            className={cn(
              titleFont.className,
              // A longer title (QUOTATION) is set smaller so it clears the details on the right.
              title.length > 7 ? 'text-[52px]' : 'text-[64px]',
              'mt-[10mm] leading-none text-[#10bfe0]',
            )}
          >
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-[6mm]">
          {AGENCY.logo ? (
            // object-cover in a wide box trims the logo image's white margins.
            // eslint-disable-next-line @next/next/no-img-element -- a plain img prints reliably
            <img src={AGENCY.logo} alt="" className="h-[26mm] w-[42mm] rounded-2xl bg-white object-cover shadow-sm" />
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
            {meta.map(([label, value], index) => (
              <div key={label} className="contents">
                <dt className="whitespace-nowrap">{label} :</dt>
                <dd className={cn('text-left whitespace-nowrap', index === 0 && 'font-medium')}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="mt-[30mm] text-[14px] leading-relaxed">
        <p className="font-bold">{recipientLabel}:</p>
        <p>{recipient.name}</p>
        {recipient.phone ? <p>{recipient.phone}</p> : null}
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
                {line.details.map((detail) => (
                  <p key={detail} className="text-[12px] text-neutral-600">
                    {detail}
                  </p>
                ))}
              </td>
              <td className="px-4 pt-5 text-right align-top tabular-nums">{formatMoney(line.price, currency)}</td>
              <td className="px-4 pt-5 text-center align-top tabular-nums">{line.quantity}</td>
              <td className="px-4 pt-5 text-right align-top tabular-nums">
                {formatMoney(line.price === null ? null : line.price * line.quantity, currency)}
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
            <td className="px-4 text-right font-bold tabular-nums">{formatMoney(total, currency)}</td>
          </tr>
        </tfoot>
      </table>

      {children}

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
