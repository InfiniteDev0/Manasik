'use client';

import { parse } from 'date-fns';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { SingleDatePicker } from '@/components/date-picker';
import { DEFAULT_PHONE_VALUE, hasPhoneNumber, PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateToString } from '@/lib/data-grid';

import { newTicket, type TicketRow } from './tickets-data';

type Field =
  | 'client'
  | 'phone'
  | 'airline'
  | 'from'
  | 'to'
  | 'departure'
  | 'collected'
  | 'commission'
  | 'pnr';

interface FieldSpec {
  name: Field;
  label: string;
  type?: string;
  placeholder?: string;
}

// The Route cell sits between these two groups — it holds two inputs, so it's
// rendered on its own below.
const FIELDS_BEFORE_ROUTE: FieldSpec[] = [
  { name: 'client', label: 'Client', placeholder: "Client's full name" },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '712 345 678' },
  { name: 'airline', label: 'Airline', placeholder: 'e.g. Qatar Airways' },
];

const FIELDS_AFTER_ROUTE: FieldSpec[] = [
  { name: 'departure', label: 'Departure', type: 'date', placeholder: 'Departure date' },
  { name: 'collected', label: 'Collected', type: 'number', placeholder: 'Paid by client' },
  { name: 'commission', label: 'Commission', type: 'number', placeholder: 'Your cut' },
  { name: 'pnr', label: 'PNR', placeholder: 'e.g. QX7K2L' },
];

/** `yyyy-mm-dd` (how a ticket stores its dates) → a Date for the calendar. */
function toDate(value: string): Date | undefined {
  return value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
}

/** Every field empty. The ticket's own date is the day it's created. */
function emptyForm(): Record<Field, string> {
  return {
    client: '',
    phone: DEFAULT_PHONE_VALUE,
    airline: '',
    from: '',
    to: '',
    departure: '',
    collected: '',
    commission: '',
    pnr: '',
  };
}

interface TicketFormProps {
  onCreate: (ticket: TicketRow) => void;
  onCancel: () => void;
}

/** The create-a-ticket form that opens above the table. */
export function TicketForm({ onCreate, onCancel }: TicketFormProps) {
  const [form, setForm] = React.useState(emptyForm);

  const setField = (name: Field, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const field = (spec: FieldSpec) => (
    <div key={spec.name} className="space-y-1.5">
      <Label htmlFor={`new-ticket-${spec.name}`} className="text-muted-foreground text-xs">
        {spec.label}
      </Label>
      {spec.name === 'phone' ? (
        <PhoneInput
          id={`new-ticket-${spec.name}`}
          placeholder={spec.placeholder}
          value={form.phone}
          onChange={(phone) => setField('phone', phone)}
        />
      ) : spec.type === 'date' ? (
        <SingleDatePicker
          id={`new-ticket-${spec.name}`}
          placeholder={spec.placeholder}
          value={toDate(form[spec.name])}
          onChange={(date) => setField(spec.name, date ? formatDateToString(date) : '')}
          className="h-9"
        />
      ) : (
        <Input
          id={`new-ticket-${spec.name}`}
          type={spec.type ?? 'text'}
          placeholder={spec.placeholder}
          required={spec.name === 'client'}
          {...(spec.type === 'number' ? { inputMode: 'decimal' as const, min: 0, step: '0.01' } : {})}
          value={form[spec.name]}
          onChange={(event) => setField(spec.name, event.target.value)}
          className="h-9 w-full"
        />
      )}
    </div>
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));
    const collected = toNumber(form.collected);
    const commission = toNumber(form.commission);

    // newTicket() dates it today — that's the ticket's created date.
    onCreate({
      ...newTicket(),
      client: form.client.trim(),
      // A bare dial code is no phone number.
      phone: hasPhoneNumber(form.phone) ? form.phone.trim() : '',
      airline: form.airline.trim(),
      route: [form.from.trim(), form.to.trim()].filter(Boolean).join(' → '),
      departure: form.departure,
      collected,
      commission,
      // What's left after the commission, once there's something to work out.
      net: collected === null ? null : collected - (commission ?? 0),
      pnr: form.pnr.trim().toUpperCase(),
    });
    setForm(emptyForm());
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-3 xl:grid-cols-5">
      {FIELDS_BEFORE_ROUTE.map(field)}

      {/* Route: where the client flies from and to, in one cell. */}
      <div className="space-y-1.5">
        <Label htmlFor="new-ticket-from" className="text-muted-foreground text-xs">
          Route
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="new-ticket-from"
            aria-label="Flying from"
            placeholder="From"
            value={form.from}
            onChange={(event) => setField('from', event.target.value)}
            className="h-9 min-w-0 flex-1 uppercase"
          />
          <span aria-hidden className="text-muted-foreground">
            —
          </span>
          <Input
            id="new-ticket-to"
            aria-label="Flying to"
            placeholder="To"
            value={form.to}
            onChange={(event) => setField('to', event.target.value)}
            className="h-9 min-w-0 flex-1 uppercase"
          />
        </div>
      </div>

      {FIELDS_AFTER_ROUTE.map(field)}

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
