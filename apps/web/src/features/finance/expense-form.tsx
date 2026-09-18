'use client';

import { parse } from 'date-fns';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { SingleDatePicker } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateToString } from '@/lib/data-grid';

import { EXPENSE_CATEGORIES, expenseCategoryLabel, type Expense, type ExpenseCategory } from './expenses-data';
import { PAYMENT_METHODS, paymentMethodLabel, type PaymentMethod } from './finance-data';

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
      {children}
    </Label>
  );
}

interface FormState {
  description: string;
  category: ExpenseCategory;
  amount: string;
  payee: string;
  method: PaymentMethod;
  reference: string;
  date: string;
}

/**
 * Every field empty. The date starts on today but can be moved back — rent
 * paid on the 1st is often only written down later.
 */
function emptyForm(): FormState {
  return {
    description: '',
    category: 'other',
    amount: '',
    payee: '',
    method: 'cash',
    reference: '',
    date: formatDateToString(new Date()),
  };
}

interface ExpenseFormProps {
  onCreate: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

/** The add-an-expense form that opens above the table. */
export function ExpenseForm({ onCreate, onCancel }: ExpenseFormProps) {
  const [form, setForm] = React.useState(emptyForm);

  const set = <K extends keyof FormState>(name: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [name]: value }));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({
      description: form.description.trim(),
      category: form.category,
      amount: form.amount.trim() === '' ? null : Number(form.amount),
      payee: form.payee.trim(),
      method: form.method,
      reference: form.reference.trim(),
      date: form.date,
    });
    setForm(emptyForm());
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 border-t p-4 md:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-description">What for</FieldLabel>
        <Input
          id="new-expense-description"
          placeholder="e.g. Office rent — September"
          required
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-category">Category</FieldLabel>
        <Select
          value={form.category}
          onValueChange={(next: string | null) => next && set('category', next as ExpenseCategory)}
        >
          <SelectTrigger id="new-expense-category" className="h-9 w-full">
            <SelectValue>{expenseCategoryLabel(form.category)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-amount">Amount</FieldLabel>
        <Input
          id="new-expense-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="How much was paid"
          required
          value={form.amount}
          onChange={(event) => set('amount', event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-payee">Paid to</FieldLabel>
        <Input
          id="new-expense-payee"
          placeholder="e.g. Landlord, Safaricom"
          value={form.payee}
          onChange={(event) => set('payee', event.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-method">Paid by</FieldLabel>
        <Select
          value={form.method}
          onValueChange={(next: string | null) => next && set('method', next as PaymentMethod)}
        >
          <SelectTrigger id="new-expense-method" className="h-9 w-full">
            <SelectValue>{paymentMethodLabel(form.method)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-reference">Reference</FieldLabel>
        <Input
          id="new-expense-reference"
          placeholder="M-Pesa code or receipt no."
          value={form.reference}
          onChange={(event) => set('reference', event.target.value)}
          className="h-9 w-full uppercase placeholder:normal-case"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="new-expense-date">Date paid</FieldLabel>
        <SingleDatePicker
          id="new-expense-date"
          value={form.date ? parse(form.date, 'yyyy-MM-dd', new Date()) : undefined}
          onChange={(date) => set('date', date ? formatDateToString(date) : formatDateToString(new Date()))}
          className="h-9"
        />
      </div>

      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full">
          Save expense
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
