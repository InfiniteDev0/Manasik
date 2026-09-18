'use client';

import { parse } from 'date-fns';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { SingleDatePicker } from '@/components/date-picker';
import { DEFAULT_PHONE_VALUE, hasPhoneNumber, PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateToString } from '@/lib/data-grid';

import { SERVICES, serviceLabel, type ServiceField, type ServiceType } from './finance-data';
import type { NewQuotation } from './finance-store';

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
      {children}
    </Label>
  );
}

/** `yyyy-mm-dd` (how dates are stored) → a Date for the calendar. */
function toDate(value: string): Date | undefined {
  return value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
}

interface QuotationFormProps {
  onCreate: (quotation: NewQuotation) => void;
  onCancel: () => void;
}

/**
 * The new-quotation form that opens above the table. Pick the service the
 * customer is asking for and the fields in the middle change to match it.
 */
export function QuotationForm({ onCreate, onCancel }: QuotationFormProps) {
  const [client, setClient] = React.useState('');
  const [phone, setPhone] = React.useState(DEFAULT_PHONE_VALUE);
  const [service, setService] = React.useState<ServiceType>('ticket');
  const [details, setDetails] = React.useState<Record<string, string>>({});
  const [amount, setAmount] = React.useState('');

  const fields = SERVICES.find((option) => option.id === service)?.fields ?? [];

  const setDetail = (name: string, value: string) => setDetails((current) => ({ ...current, [name]: value }));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({
      client: client.trim(),
      // A bare dial code is no phone number.
      phone: hasPhoneNumber(phone) ? phone.trim() : '',
      service,
      // Only this service's fields — not leftovers from one picked earlier.
      details: Object.fromEntries(
        fields.map(({ name }) => [name, details[name]?.trim() ?? '']).filter(([, value]) => value),
      ),
      amount: amount.trim() === '' ? null : Number(amount),
    });
    setClient('');
    setPhone(DEFAULT_PHONE_VALUE);
    setDetails({});
    setAmount('');
  };

  const serviceField = (field: ServiceField) => {
    const id = `new-quotation-${field.name}`;
    return (
      <div key={`${service}-${field.name}`} className="space-y-1.5">
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        {field.type === 'date' ? (
          <SingleDatePicker
            id={id}
            placeholder={field.placeholder}
            value={toDate(details[field.name] ?? '')}
            onChange={(date) => setDetail(field.name, date ? formatDateToString(date) : '')}
            className="h-9"
          />
        ) : (
          <Input
            id={id}
            type={field.type ?? 'text'}
            {...(field.type === 'number' ? { inputMode: 'numeric' as const, min: 1 } : {})}
            placeholder={field.placeholder}
            value={details[field.name] ?? ''}
            onChange={(event) => setDetail(field.name, event.target.value)}
            className="h-9 w-full"
          />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-quotation-client">Client</FieldLabel>
        <Input
          id="new-quotation-client"
          placeholder="Client's full name"
          required
          value={client}
          onChange={(event) => setClient(event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-quotation-phone">Phone</FieldLabel>
        <PhoneInput id="new-quotation-phone" placeholder="712 345 678" value={phone} onChange={setPhone} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-quotation-service">Service</FieldLabel>
        <Select
          value={service}
          onValueChange={(next: string | null) => next && setService(next as ServiceType)}
        >
          <SelectTrigger id="new-quotation-service" className="h-9 w-full">
            <SelectValue>{serviceLabel(service)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SERVICES.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {fields.map(serviceField)}

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-quotation-amount">Amount</FieldLabel>
        <Input
          id="new-quotation-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="Price you're quoting"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full">
          Save quotation
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
