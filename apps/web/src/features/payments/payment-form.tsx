'use client';

import type { PaymentMethod } from '@manasik/types';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { todayIso } from '@/lib/dates';
import { DEFAULT_CURRENCY, formatMoney, toMajorUnits, toMinorUnits } from '@/lib/money';
import { enumLabel, t } from '@/lib/strings';
import { listInvoices } from '@/mocks/queries';
import { recordPayment, useMockQuery } from '@/mocks/store';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locks the payment to one invoice when opened from a booking. */
  invoiceId?: string;
}

const METHODS: PaymentMethod[] = ['MPESA', 'BANK_TRANSFER', 'CASH', 'CARD'];

/** Methods that produce a reference worth capturing — cash does not. */
const METHODS_WITH_REFERENCE: PaymentMethod[] = ['MPESA', 'BANK_TRANSFER', 'CARD'];

export function PaymentForm({ open, onOpenChange, invoiceId }: PaymentFormProps) {
  const invoices = useMockQuery(listInvoices);

  const [form, setForm] = React.useState(() => initialState(invoiceId));
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(initialState(invoiceId));
      setError(null);
    }
  }, [open, invoiceId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  const invoice = invoices.find((row) => row.id === form.invoiceId);
  const amount = toMinorUnits(Number(form.amount) || 0);
  const showsReference = METHODS_WITH_REFERENCE.includes(form.method);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.invoiceId) {
      setError('Choose an invoice.');
      return;
    }
    if (amount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    // A warning rather than a block: overpayments happen (a wrong M-Pesa
    // amount arrives and has to be recorded before it can be refunded).
    if (invoice && amount > invoice.balanceDue) {
      setError(t('payments.amountExceedsBalance'));
      return;
    }

    recordPayment({
      invoiceId: form.invoiceId,
      amount,
      paymentDate: form.paymentDate || todayIso(),
      method: form.method,
      externalReference: showsReference ? form.externalReference.trim() || null : null,
      note: form.note.trim(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('payments.record')}</DialogTitle>
          <DialogDescription>{t('payments.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 text-xs font-medium">{t('payments.invoice')}</Label>
            <Select
              value={form.invoiceId}
              onValueChange={(value: unknown) => set('invoiceId', String(value))}
              disabled={Boolean(invoiceId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices
                  .filter((row) => row.balanceDue > 0 || row.id === form.invoiceId)
                  .map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.number} — {row.pilgrim?.fullName ?? '—'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {invoice ? (
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payments.invoiceTotal')}</span>
                <span className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payments.amountPaid')}</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.amountPaid, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-medium">
                <span>{t('payments.balanceDue')}</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.balanceDue, invoice.currency)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('payments.amount')} ({DEFAULT_CURRENCY})</Label>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(event) => set('amount', event.target.value)}
              />
              {invoice && invoice.balanceDue > 0 ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={() => set('amount', String(toMajorUnits(invoice.balanceDue)))}
                >
                  Pay full balance ({formatMoney(invoice.balanceDue, invoice.currency)})
                </button>
              ) : null}
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('payments.paymentDate')}</Label>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(event) => set('paymentDate', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('payments.method')}</Label>
              <Select
                value={form.method}
                onValueChange={(value: unknown) => set('method', value as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {enumLabel(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showsReference ? (
              <div>
                <Label className="mb-1.5 text-xs font-medium">
                  {t('payments.externalReference')}
                </Label>
                <Input
                  value={form.externalReference}
                  onChange={(event) => set('externalReference', event.target.value)}
                  placeholder={form.method === 'MPESA' ? 'SJK4H7QW2P' : 'FT27018994210'}
                />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('payments.note')}</Label>
              <Textarea
                rows={2}
                value={form.note}
                onChange={(event) => set('note', event.target.value)}
                placeholder="Deposit, second installment…"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('payments.record')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface FormState {
  invoiceId: string;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
  externalReference: string;
  note: string;
}

function initialState(invoiceId?: string): FormState {
  return {
    invoiceId: invoiceId ?? '',
    amount: '',
    paymentDate: todayIso(),
    // M-Pesa first: it is how most Kenyan agencies are actually paid.
    method: 'MPESA',
    externalReference: '',
    note: '',
  };
}
