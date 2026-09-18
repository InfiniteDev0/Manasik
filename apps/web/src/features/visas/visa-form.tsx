'use client';

import { XIcon } from 'lucide-react';
import * as React from 'react';

import { CountryPicker } from '@/components/country-picker';
import { CalculatedAmount, MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Currency } from '@/lib/currency';

import { FieldLabel } from './visa-fields';
import { newVisa, type VisaRow } from './visas-data';

// Typed in: what the client paid and what the visa costs you. The commission
// isn't — it's what's left, paid − net.
type MoneyField = 'paid' | 'net';

const MONEY_FIELDS: { name: MoneyField; label: string; placeholder: string }[] = [
  { name: 'paid', label: 'Paid amount', placeholder: 'Paid by client' },
  { name: 'net', label: 'Net amount', placeholder: 'What the visa costs you' },
];

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

interface FormState {
  name: string;
  country: string;
  broker: string;
  currency: Currency;
  paid: string;
  net: string;
}

/**
 * Every field empty. The visa's date is the day it's created, and it starts
 * Pending — it's approved or rejected later, from its edit panel.
 */
function emptyForm(): FormState {
  return { name: '', country: '', broker: '', currency: 'USD', paid: '', net: '' };
}

interface VisaFormProps {
  onCreate: (visa: VisaRow) => void;
  onCancel: () => void;
}

/** The create-a-visa form that opens above the table. */
export function VisaForm({ onCreate, onCancel }: VisaFormProps) {
  const [form, setForm] = React.useState(emptyForm);
  const paid = toNumber(form.paid);
  const net = toNumber(form.net);
  const commission = paid === null || net === null ? null : paid - net;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // newVisa() dates it today and makes it Pending.
    onCreate({
      ...newVisa(),
      name: form.name.trim(),
      country: form.country,
      broker: form.broker.trim(),
      currency: form.currency,
      paid,
      net,
      commission,
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
        <FieldLabel htmlFor="new-visa-country">Country</FieldLabel>
        <CountryPicker
          id="new-visa-country"
          value={form.country}
          onChange={(country) => setForm((current) => ({ ...current, country }))}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-visa-broker">Broker</FieldLabel>
        <Input
          id="new-visa-broker"
          placeholder="Who's processing it"
          value={form.broker}
          onChange={(event) => setForm((current) => ({ ...current, broker: event.target.value }))}
          className="h-9 w-full"
        />
      </div>

      {/* The amounts share the visa's one currency — changing either changes it. */}
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

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-visa-commission">Commission</FieldLabel>
        <CalculatedAmount id="new-visa-commission" value={commission} currency={form.currency} formula="Paid − net" />
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
