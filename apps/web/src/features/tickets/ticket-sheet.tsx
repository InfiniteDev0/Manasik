'use client';

import { Trash2Icon } from 'lucide-react';
import * as React from 'react';

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

import type { TicketRow } from './tickets-data';

type TextField = 'date' | 'client' | 'airline' | 'route' | 'departure' | 'phone' | 'pnr' | 'reference';
type MoneyField = 'collected' | 'commission' | 'net';

const TEXT_FIELDS: { name: TextField; label: string; type?: string; placeholder?: string }[] = [
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'client', label: 'Client', placeholder: 'Full name' },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+254 7…' },
  { name: 'airline', label: 'Airline', placeholder: 'e.g. Qatar Airways' },
  { name: 'route', label: 'Route', placeholder: 'e.g. NBO → JED' },
  { name: 'departure', label: 'Departure', type: 'date' },
  { name: 'pnr', label: 'PNR' },
  { name: 'reference', label: 'Ref' },
];

const MONEY_FIELDS: { name: MoneyField; label: string }[] = [
  { name: 'collected', label: 'Collected' },
  { name: 'commission', label: 'Commission' },
  { name: 'net', label: 'Net' },
];

interface TicketFormProps {
  ticket: TicketRow;
  isNew: boolean;
  onCancel: () => void;
  onSave: (ticket: TicketRow) => void;
  onDelete?: () => void;
}

function TicketForm({ ticket, isNew, onCancel, onSave, onDelete }: TicketFormProps) {
  const [draft, setDraft] = React.useState(ticket);
  // Money is edited as text so a half-typed "12." isn't lost; converted on save.
  const [money, setMoney] = React.useState<Record<MoneyField, string>>({
    collected: ticket.collected?.toString() ?? '',
    commission: ticket.commission?.toString() ?? '',
    net: ticket.net?.toString() ?? '',
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));
    onSave({
      ...draft,
      client: draft.client.trim(),
      collected: toNumber(money.collected),
      commission: toNumber(money.commission),
      net: toNumber(money.net),
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
        {TEXT_FIELDS.map((field) => (
          <div
            key={field.name}
            className={field.name === 'client' ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}
          >
            <Label htmlFor={`ticket-${field.name}`}>{field.label}</Label>
            <Input
              id={`ticket-${field.name}`}
              type={field.type ?? 'text'}
              placeholder={field.placeholder}
              value={draft[field.name]}
              required={field.name === 'client'}
              onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))}
              className="h-9"
            />
          </div>
        ))}

        {MONEY_FIELDS.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`ticket-${field.name}`}>{field.label}</Label>
            <Input
              id={`ticket-${field.name}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={money[field.name]}
              onChange={(event) => setMoney((current) => ({ ...current, [field.name]: event.target.value }))}
              className="h-9 tabular-nums"
            />
          </div>
        ))}
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
