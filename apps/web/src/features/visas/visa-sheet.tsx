'use client';

import { Trash2Icon } from 'lucide-react';
import * as React from 'react';

import { CalculatedAmount, MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { FieldLabel, VisaStatusSelect } from './visa-fields';
import type { VisaRow } from './visas-data';

// Typed in: what the client paid and what the visa costs you. The commission
// isn't — it's what's left, paid − net.
type MoneyField = 'paid' | 'net';

const MONEY_FIELDS: { name: MoneyField; label: string }[] = [
  { name: 'paid', label: 'Paid amount' },
  { name: 'net', label: 'Net amount' },
];

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

interface VisaEditFormProps {
  visa: VisaRow;
  onCancel: () => void;
  onSave: (visa: VisaRow) => void;
  onDelete?: () => void;
}

function VisaEditForm({ visa, onCancel, onSave, onDelete }: VisaEditFormProps) {
  const [draft, setDraft] = React.useState(visa);
  // Amounts are edited as text so a half-typed "12." isn't lost; converted on save.
  const [money, setMoney] = React.useState<Record<MoneyField, string>>({
    paid: visa.paid?.toString() ?? '',
    net: visa.net?.toString() ?? '',
  });
  const paid = toNumber(money.paid);
  const net = toNumber(money.net);
  const commission = paid === null || net === null ? null : paid - net;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...draft,
      name: draft.name.trim(),
      city: draft.city.trim(),
      paid,
      net,
      commission,
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>Edit visa</SheetTitle>
        <SheetDescription>Changes save when you press Save.</SheetDescription>
      </SheetHeader>

      <div className="scrollbar-pill grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto px-4 pb-4">
        <div className="col-span-2 space-y-1.5">
          <FieldLabel htmlFor="visa-name">Name</FieldLabel>
          <Input
            id="visa-name"
            required
            value={draft.name}
            // Names are kept in capitals, like on a passport.
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value.toUpperCase() }))}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="visa-status">Visa status</FieldLabel>
          <VisaStatusSelect
            id="visa-status"
            value={draft.status}
            onValueChange={(status) => setDraft((current) => ({ ...current, status }))}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="visa-city">City</FieldLabel>
          <Input
            id="visa-city"
            placeholder="e.g. Dubai"
            value={draft.city}
            onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
            className="h-9"
          />
        </div>

        {/* The amounts share the visa's one currency. */}
        {MONEY_FIELDS.map((field) => (
          <div key={field.name} className="col-span-2 space-y-1.5">
            <FieldLabel htmlFor={`visa-${field.name}`}>{field.label}</FieldLabel>
            <MoneyInput
              id={`visa-${field.name}`}
              value={money[field.name]}
              onValueChange={(value) => setMoney((current) => ({ ...current, [field.name]: value }))}
              currency={draft.currency}
              onCurrencyChange={(currency) => setDraft((current) => ({ ...current, currency }))}
            />
          </div>
        ))}

        <div className="col-span-2 space-y-1.5">
          <FieldLabel htmlFor="visa-commission">Commission</FieldLabel>
          <CalculatedAmount id="visa-commission" value={commission} currency={draft.currency} formula="Paid − net" />
        </div>
      </div>

      <SheetFooter className="flex-row items-center justify-end border-t">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive me-auto"
          >
            <Trash2Icon />
            Delete
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </SheetFooter>
    </form>
  );
}

interface VisaSheetProps {
  open: boolean;
  /** The visa being edited. Kept while the sheet animates closed. */
  visa: VisaRow | null;
  onClose: () => void;
  onSave: (visa: VisaRow) => void;
  onDelete?: () => void;
}

/** Side panel for editing one visa. */
export function VisaSheet({ open, visa, onClose, onSave, onDelete }: VisaSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {/* Keyed by id so opening another visa starts from its own values. */}
        {visa ? (
          <VisaEditForm key={visa.id} visa={visa} onCancel={onClose} onSave={onSave} onDelete={onDelete} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
