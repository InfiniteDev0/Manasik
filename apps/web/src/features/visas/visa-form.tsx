'use client';

import { XIcon } from 'lucide-react';
import * as React from 'react';

import { MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Currency } from '@/lib/currency';

import { FieldLabel, VisaStatusSelect } from './visa-fields';
import { newVisa, type VisaRow, type VisaStatus } from './visas-data';

type MoneyField = 'net' | 'paid' | 'commission';

const MONEY_FIELDS: { name: MoneyField; label: string; placeholder: string }[] = [
  { name: 'net', label: 'Net amount', placeholder: 'What it costs you' },
  { name: 'paid', label: 'Paid amount', placeholder: 'Paid by client' },
  { name: 'commission', label: 'Commission', placeholder: 'Your cut' },
];

interface FormState {
  name: string;
  status: VisaStatus;
  city: string;
  currency: Currency;
  net: string;
  paid: string;
  commission: string;
}

/** Every field empty. The visa's date is the day it's created. */
function emptyForm(): FormState {
  return { name: '', status: 'pending', city: '', currency: 'USD', net: '', paid: '', commission: '' };
}

interface VisaFormProps {
  onCreate: (visa: VisaRow) => void;
  onCancel: () => void;
}

/** The create-a-visa form that opens above the table. */
export function VisaForm({ onCreate, onCancel }: VisaFormProps) {
  const [form, setForm] = React.useState(emptyForm);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

    // newVisa() dates it today — that's the visa's created date.
    onCreate({
      ...newVisa(),
      name: form.name.trim(),
      status: form.status,
      city: form.city.trim(),
      currency: form.currency,
      net: toNumber(form.net),
      paid: toNumber(form.paid),
      commission: toNumber(form.commission),
    });
    setForm(emptyForm());
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-visa-name">Name</FieldLabel>
        <Input
          id="new-visa-name"
          placeholder="Client's full name"
          required
          value={form.name}
          // Names are kept in capitals, like on a passport.
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value.toUpperCase() }))}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-visa-status">Visa status</FieldLabel>
        <VisaStatusSelect
          id="new-visa-status"
          value={form.status}
          onValueChange={(status) => setForm((current) => ({ ...current, status }))}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-visa-city">City</FieldLabel>
        <Input
          id="new-visa-city"
          placeholder="e.g. Dubai"
          value={form.city}
          onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          className="h-9 w-full"
        />
      </div>

      {/* All three amounts share the visa's one currency — changing any changes it. */}
      {MONEY_FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <FieldLabel htmlFor={`new-visa-${field.name}`}>{field.label}</FieldLabel>
          <MoneyInput
            id={`new-visa-${field.name}`}
            placeholder={field.placeholder}
            value={form[field.name]}
            onValueChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
            currency={form.currency}
            onCurrencyChange={(currency) => setForm((current) => ({ ...current, currency }))}
          />
        </div>
      ))}

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
