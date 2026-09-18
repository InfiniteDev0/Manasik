'use client';

import { parse } from 'date-fns';
import { Trash2Icon } from 'lucide-react';
import * as React from 'react';

import { AirportPicker } from '@/components/airport-picker';
import { SingleDatePicker, TripDatePicker } from '@/components/date-picker';
import { MoneyInput } from '@/components/money-input';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';

import type { TicketRow } from './tickets-data';

// Typed in: what the client paid and what goes to the airline. The commission
// isn't — it's what's left, collected − net.
type MoneyField = 'collected' | 'net';

const MONEY_FIELDS: { name: MoneyField; label: string }[] = [
  { name: 'collected', label: 'Collected' },
  { name: 'net', label: 'Net (airline)' },
];

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

/** "NBO → JED" → ["NBO", "JED"]. */
function splitRoute(route: string): [string, string] {
  const [from = '', to = ''] = route.split('→').map((part) => part.trim());
  return [from, to];
}

interface TicketFormProps {
  ticket: TicketRow;
  isNew: boolean;
  onCancel: () => void;
  onSave: (ticket: TicketRow) => void;
  onDelete?: () => void;
}

function TicketForm({ ticket, isNew, onCancel, onSave, onDelete }: TicketFormProps) {
  const [draft, setDraft] = React.useState(ticket);
  const [[from, to], setRoute] = React.useState(() => splitRoute(ticket.route));
  // Money is edited as text so a half-typed "12." isn't lost; converted on save.
  const [money, setMoney] = React.useState<Record<MoneyField, string>>({
    collected: ticket.collected?.toString() ?? '',
    net: ticket.net?.toString() ?? '',
  });
  const collected = toNumber(money.collected);
  const net = toNumber(money.net);
  const commission = collected === null || net === null ? null : collected - net;

  const set = <K extends keyof TicketRow>(name: K, value: TicketRow[K]) =>
    setDraft((current) => ({ ...current, [name]: value }));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...draft,
      client: draft.client.trim(),
      route: [from, to].filter(Boolean).join(' → '),
      pnr: draft.pnr.trim().toUpperCase(),
      reference: draft.reference.trim(),
      collected,
      net,
      commission,
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{isNew ? 'Add ticket' : 'Edit ticket'}</SheetTitle>
        <SheetDescription>
          {isNew ? 'Issue a ticket to a client.' : 'Changes save when you press Save.'}
        </SheetDescription>
      </SheetHeader>

      <div className="scrollbar-pill grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto px-4 pb-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ticket-client">Client</Label>
          <Input
            id="ticket-client"
            placeholder="Full name"
            required
            value={draft.client}
            // Names are kept in capitals, like on a passport.
            onChange={(event) => set('client', event.target.value.toUpperCase())}
            className="h-9"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ticket-phone">Phone</Label>
          <PhoneInput id="ticket-phone" value={draft.phone} onChange={(phone) => set('phone', phone)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-airline">Airline</Label>
          <Input
            id="ticket-airline"
            placeholder="e.g. Qatar Airways"
            value={draft.airline}
            onChange={(event) => set('airline', event.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-date">Date created</Label>
          <SingleDatePicker
            id="ticket-date"
            value={draft.date ? parse(draft.date, 'yyyy-MM-dd', new Date()) : undefined}
            onChange={(date) => date && set('date', formatDateToString(date))}
            className="h-9"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ticket-from">Route</Label>
          <div className="flex items-center gap-2">
            <AirportPicker
              id="ticket-from"
              aria-label="Flying from"
              placeholder="From"
              value={from}
              onChange={(code) => setRoute([code, to])}
              className="flex-1"
            />
            <span aria-hidden className="text-muted-foreground">
              —
            </span>
            <AirportPicker
              aria-label="Flying to"
              placeholder="To"
              value={to}
              onChange={(code) => setRoute([from, code])}
              className="flex-1"
            />
          </div>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ticket-departure">Departure — return</Label>
          <TripDatePicker
            id="ticket-departure"
            departure={draft.departure}
            returnDate={draft.returnDate}
            onChange={(departure, returnDate) => setDraft((current) => ({ ...current, departure, returnDate }))}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-pnr">PNR</Label>
          <Input
            id="ticket-pnr"
            value={draft.pnr}
            onChange={(event) => set('pnr', event.target.value)}
            className="h-9 uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-reference">Ref</Label>
          <Input
            id="ticket-reference"
            placeholder="Who referred the client"
            value={draft.reference}
            onChange={(event) => set('reference', event.target.value)}
            className="h-9"
          />
        </div>

        {/* The amounts share the ticket's one currency. */}
        {MONEY_FIELDS.map((field) => (
          <div key={field.name} className="col-span-2 space-y-1.5">
            <Label htmlFor={`ticket-${field.name}`}>{field.label}</Label>
            <MoneyInput
              id={`ticket-${field.name}`}
              value={money[field.name]}
              onValueChange={(value) => setMoney((current) => ({ ...current, [field.name]: value }))}
              currency={draft.currency}
              onCurrencyChange={(currency) => set('currency', currency)}
            />
          </div>
        ))}

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="ticket-commission">Commission</Label>
          <output
            id="ticket-commission"
            className="bg-muted/50 text-foreground flex h-9 items-center justify-between rounded-lg border px-2.5 text-sm tabular-nums"
          >
            <span className={commission === null ? 'text-muted-foreground' : undefined}>
              {commission === null ? 'Collected − net' : formatMoney(commission, draft.currency)}
            </span>
            <span className="text-muted-foreground text-xs">auto</span>
          </output>
        </div>
      </div>

      <SheetFooter className="flex-row items-center justify-end border-t">
        {onDelete ? (
          <Button type="button" variant="ghost" onClick={onDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive me-auto">
            <Trash2Icon />
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isNew ? 'Add ticket' : 'Save'}</Button>
      </SheetFooter>
    </form>
  );
}

interface TicketSheetProps {
  open: boolean;
  /** The ticket being edited or added. Kept while the sheet animates closed. */
  ticket: TicketRow | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (ticket: TicketRow) => void;
  /** Only for an existing ticket. */
  onDelete?: () => void;
}

/** Side panel for adding or editing one ticket. */
export function TicketSheet({ open, ticket, isNew, onClose, onSave, onDelete }: TicketSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {/* Keyed by id so opening another ticket starts from its own values. */}
        {ticket ? (
          <TicketForm
            key={ticket.id}
            ticket={ticket}
            isNew={isNew}
            onCancel={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
