'use client';

import { format, parse } from 'date-fns';
import { MapPinIcon, PlaneIcon } from 'lucide-react';
import type * as React from 'react';

import { formatAmount } from '@/lib/format';

import { AGENCY } from './agency';
import { paymentMethodLabel, serviceLabel, type Receipt } from './finance-data';

function money(value: number | null): string {
  return `${AGENCY.currency} ${formatAmount(value)}`;
}

/** A label on the left, its value pushed to the right. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span>{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function DashedRule() {
  return <div className="my-3 border-t-[1.5px] border-dashed border-neutral-800" />;
}

/** The pin, a dotted flight path, and the plane — across the bottom of the slip. */
function FlightPath() {
  return (
    <div className="flex items-center gap-1 text-neutral-800" aria-hidden>
      <MapPinIcon className="size-7 shrink-0 fill-neutral-800 [&>circle]:fill-white" />
      <svg viewBox="0 0 200 40" className="h-8 min-w-0 flex-1" fill="none">
        <path
          d="M2 26 C 30 4, 55 4, 70 22 S 110 44, 130 24 S 170 6, 198 22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="7 7"
          strokeLinecap="round"
        />
      </svg>
      <PlaneIcon className="size-7 shrink-0 rotate-45 fill-neutral-800" />
    </div>
  );
}

/**
 * A receipt as a printed slip, 80 mm wide like a till roll: the agency name,
 * who paid and for what, the total, and a thank-you. Always black on white.
 * `.print-area` and `.receipt-page` (globals.css) make it print as exactly
 * one slip — "Save as PDF" gives a phone-sized file for WhatsApp.
 */
export function ReceiptSlip({ receipt }: { receipt: Receipt }) {
  return (
    <article className="receipt-page print-area flex h-[142mm] w-[80mm] shrink-0 flex-col bg-white px-[7mm] pt-[9mm] pb-[6mm] text-[11px] tracking-wide text-neutral-900">
      <header className="text-center">
        <p className="text-[19px] leading-tight font-extrabold tracking-[0.08em] uppercase italic">{AGENCY.name}</p>
        <p className="mt-1 text-[16px] tracking-wider">Receipt</p>
      </header>

      <section className="mt-[7mm] space-y-1">
        <Row label="Receipt No:">{receipt.number}</Row>
        <Row label="Date:">{format(parse(receipt.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}</Row>
        <Row label="Received from:">{receipt.client}</Row>
        <Row label="Invoice:">{receipt.invoiceNumber}</Row>
      </section>

      <DashedRule />

      <section>
        <Row label={serviceLabel(receipt.service)}>{money(receipt.amount)}</Row>
        {receipt.description ? <p className="mt-0.5 text-[9.5px] text-neutral-600">{receipt.description}</p> : null}
      </section>

      <DashedRule />

      <section className="space-y-1">
        <Row label="PAID BY:">{paymentMethodLabel(receipt.method)}</Row>
        <Row label="TOTAL:">{money(receipt.amount)}</Row>
      </section>

      <footer className="mt-auto flex flex-col items-center gap-3 text-center">
        <p className="max-w-[52mm] text-[11px] italic">{AGENCY.receiptNote}</p>
        <p className="text-[15px] font-extrabold tracking-[0.08em] uppercase italic">Thank you!</p>
        <div className="w-full">
          <FlightPath />
        </div>
        <p className="text-[11px] tracking-wider">{AGENCY.website}</p>
      </footer>
    </article>
  );
}
