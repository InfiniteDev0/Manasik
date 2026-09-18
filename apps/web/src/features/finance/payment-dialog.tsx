'use client';

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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney } from '@/lib/currency';

import { PAYMENT_METHODS, paymentMethodLabel, type Invoice, type PaymentMethod } from './finance-data';

interface PaymentDialogProps {
  open: boolean;
  invoice: Invoice;
  onOpenChange: (open: boolean) => void;
  onConfirm: (method: PaymentMethod) => void;
}

/** Confirms an invoice has been paid, and how. */
export function PaymentDialog({ open, invoice, onOpenChange, onConfirm }: PaymentDialogProps) {
  const [method, setMethod] = React.useState<PaymentMethod>('cash');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
          <DialogDescription>
            {invoice.number} · {invoice.client} · {formatMoney(invoice.amount, invoice.currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor={`payment-method-${invoice.id}`} className="text-muted-foreground text-xs">
            Paid by
          </Label>
          <Select value={method} onValueChange={(next: string | null) => next && setMethod(next as PaymentMethod)}>
            <SelectTrigger id={`payment-method-${invoice.id}`} className="h-9 w-full">
              <SelectValue>{paymentMethodLabel(method)}</SelectValue>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(method)}>Confirm payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
