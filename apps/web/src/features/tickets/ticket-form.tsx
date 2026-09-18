'use client';

import { XIcon } from 'lucide-react';
import * as React from 'react';

import { AirportPicker } from '@/components/airport-picker';
import { TripDatePicker } from '@/components/date-picker';
import { CalculatedAmount, MoneyInput } from '@/components/money-input';
import { DEFAULT_PHONE_VALUE, hasPhoneNumber, PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Currency } from '@/lib/currency';

import { newTicket, type TicketRow } from './tickets-data';

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
      {children}
    </Label>
  );
}

interface FormState {
  client: string;
  phone: string;
  airline: string;
  from: string;
  to: string;
  departure: string;
  /** '' for no return. */
  returnDate: string;
  currency: Currency;
  collected: string;
  /** What's sent to the airline. The commission is what's left: collected − net. */
  net: string;
  pnr: string;
  /** Who referred the client. */
  reference: string;
}

/** Every field empty. The ticket's own date is the day it's created. */
function emptyForm(): FormState {
  return {
    client: '',
    phone: DEFAULT_PHONE_VALUE,
    airline: '',
    from: '',
    to: '',
    departure: '',
    returnDate: '',
    currency: 'USD',
    collected: '',
    net: '',
    pnr: '',
    reference: '',
  };
}

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

/** Collected − airline net, once both are in. */
function commissionOf(collected: number | null, net: number | null): number | null {
  return collected === null || net === null ? null : collected - net;
}

interface TicketFormProps {
  onCreate: (ticket: TicketRow) => void;
  onCancel: () => void;
}

/** The create-a-ticket form that opens above the table. */
export function TicketForm({ onCreate, onCancel }: TicketFormProps) {
  const [form, setForm] = React.useState(emptyForm);

  const set = <K extends keyof FormState>(name: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [name]: value }));

  const collected = toNumber(form.collected);
  const net = toNumber(form.net);
  const commission = commissionOf(collected, net);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // newTicket() dates it today — that's the ticket's created date.
    onCreate({
      ...newTicket(),
      client: form.client.trim(),
      // A bare dial code is no phone number.
      phone: hasPhoneNumber(form.phone) ? form.phone.trim() : '',
      airline: form.airline.trim(),
      route: [form.from.trim(), form.to.trim()].filter(Boolean).join(' → '),
      departure: form.departure,
      returnDate: form.returnDate,
      currency: form.currency,
      collected,
      net,
      commission,
      pnr: form.pnr.trim().toUpperCase(),
      reference: form.reference.trim(),
    });
    setForm(emptyForm());
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-client">Client</FieldLabel>
        <Input
          id="new-ticket-client"
          placeholder="Client's full name"
          required
          value={form.client}
          // Names are kept in capitals, like on a passport.
          onChange={(event) => set('client', event.target.value.toUpperCase())}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-phone">Phone</FieldLabel>
        <PhoneInput
          id="new-ticket-phone"
          placeholder="712 345 678"
          value={form.phone}
          onChange={(phone) => set('phone', phone)}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-airline">Airline</FieldLabel>
        <Input
          id="new-ticket-airline"
          placeholder="e.g. Qatar Airways"
          value={form.airline}
          onChange={(event) => set('airline', event.target.value)}
          className="h-9 w-full"
        />
      </div>

      {/* Route: where the client flies from and to, in one cell. */}
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-from">Route</FieldLabel>
        <div className="flex items-center gap-2">
          <AirportPicker
            id="new-ticket-from"
            aria-label="Flying from"
            placeholder="From"
            value={form.from}
            onChange={(code) => set('from', code)}
            className="flex-1"
          />
          <span aria-hidden className="text-muted-foreground">
            —
          </span>
          <AirportPicker
            id="new-ticket-to"
            aria-label="Flying to"
            placeholder="To"
            value={form.to}
            onChange={(code) => set('to', code)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-departure">Departure — return</FieldLabel>
        <TripDatePicker
          id="new-ticket-departure"
          departure={form.departure}
          returnDate={form.returnDate}
          onChange={(departure, returnDate) => setForm((current) => ({ ...current, departure, returnDate }))}
          className="h-9"
        />
      </div>

      {/* The amounts share one currency — changing either changes the ticket's. */}
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-collected">Collected</FieldLabel>
        <MoneyInput
          id="new-ticket-collected"
          placeholder="Paid by client"
          value={form.collected}
          onValueChange={(value) => set('collected', value)}
          currency={form.currency}
          onCurrencyChange={(currency) => set('currency', currency)}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-net">Net (airline)</FieldLabel>
        <MoneyInput
          id="new-ticket-net"
          placeholder="Sent to the airline"
          value={form.net}
          onValueChange={(value) => set('net', value)}
          currency={form.currency}
          onCurrencyChange={(currency) => set('currency', currency)}
        />
      </div>

      {/* Not typed — it's whatever is left of the collected money after the airline's net. */}
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-commission">Commission</FieldLabel>
        <CalculatedAmount
          id="new-ticket-commission"
          value={commission}
          currency={form.currency}
          formula="Collected − net"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-pnr">PNR</FieldLabel>
        <Input
          id="new-ticket-pnr"
          placeholder="e.g. QX7K2L"
          value={form.pnr}
          onChange={(event) => set('pnr', event.target.value)}
          className="h-9 w-full uppercase placeholder:normal-case"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-ticket-reference">Ref</FieldLabel>
        <Input
          id="new-ticket-reference"
          placeholder="Who referred the client"
          value={form.reference}
          onChange={(event) => set('reference', event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full">
          Create
        </Button>
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" size="lg" onClick={onCancel} className="w-full">
          <XIcon />
          Close
        </Button>
      </div>
    </form>
  );
}
