'use client';

import * as React from 'react';

import type { TravelPackage } from '@manasik/types';

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
import { DEFAULT_CURRENCY, toMajorUnits, toMinorUnits } from '@/lib/money';
import { enumLabel, statusLabel, t } from '@/lib/strings';
import { createPackage, updatePackage, type PackageInput } from '@/mocks/store';

interface PackageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  initial?: TravelPackage;
}

/**
 * Create/edit dialog for a package.
 *
 * <p>Prices are entered in whole currency units and converted to minor units
 * on submit — staff type "450000", not "45000000". The conversion lives here
 * at the form edge so nothing downstream has to wonder which unit it holds.
 */
export function PackageForm({ open, onOpenChange, initial }: PackageFormProps) {
  const [form, setForm] = React.useState(() => toFormState(initial));
  const [error, setError] = React.useState<string | null>(null);

  // Re-seed when the dialog opens so an edit does not show the previous
  // record's values, and a create after an edit starts blank.
  //
  // Keyed on the record's id, not the object: `initial` comes from a derived
  // query and is a new object every render, so depending on it would re-seed
  // the form on each keystroke and discard whatever was being typed.
  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  React.useEffect(() => {
    if (!open) return;
    setForm(toFormState(initialRef.current));
    setError(null);
  }, [open, initial?.id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Give the package a name.');
      return;
    }
    if (!form.departureDate || !form.returnDate) {
      setError('Both departure and return dates are required.');
      return;
    }
    if (form.returnDate < form.departureDate) {
      setError('The return date cannot be before departure.');
      return;
    }

    const input: PackageInput = {
      name: form.name.trim(),
      type: form.type,
      destination: form.destination.trim(),
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      pricePerPilgrim: toMinorUnits(Number(form.pricePerPilgrim) || 0),
      currency: DEFAULT_CURRENCY,
      capacity: Number(form.capacity) || 0,
      depositAmount: toMinorUnits(Number(form.depositAmount) || 0),
      paymentDueDate: form.paymentDueDate || null,
      description: form.description.trim(),
      inclusions: splitLines(form.inclusions),
      exclusions: splitLines(form.exclusions),
      itinerary: form.itinerary.trim(),
      status: form.status,
    };

    if (initial) {
      updatePackage(initial.id, input);
    } else {
      createPackage(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('packages.edit') : t('packages.create')}</DialogTitle>
          <DialogDescription>{t('packages.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('packages.name')} className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="Ramadan Umrah 2027"
              />
            </Field>

            <Field label={t('packages.type')}>
              <Select
                value={form.type}
                onValueChange={(value: unknown) => set('type', value as FormState['type'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UMRAH">{enumLabel('UMRAH')}</SelectItem>
                  <SelectItem value="HAJJ">{enumLabel('HAJJ')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('common.status')}>
              <Select
                value={form.status}
                onValueChange={(value: unknown) => set('status', value as FormState['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['DRAFT', 'ACTIVE', 'SOLD_OUT', 'COMPLETED'] as const).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('packages.destination')} className="sm:col-span-2">
              <Input
                value={form.destination}
                onChange={(event) => set('destination', event.target.value)}
                placeholder="Nairobi → Jeddah → Makkah → Madinah"
              />
            </Field>

            <Field label={t('packages.departureDate')}>
              <Input
                type="date"
                value={form.departureDate}
                onChange={(event) => set('departureDate', event.target.value)}
              />
            </Field>

            <Field label={t('packages.returnDate')}>
              <Input
                type="date"
                value={form.returnDate}
                onChange={(event) => set('returnDate', event.target.value)}
              />
            </Field>

            <Field label={`${t('packages.price')} (${DEFAULT_CURRENCY})`}>
              <Input
                type="number"
                min={0}
                value={form.pricePerPilgrim}
                onChange={(event) => set('pricePerPilgrim', event.target.value)}
              />
            </Field>

            <Field label={t('packages.capacity')}>
              <Input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(event) => set('capacity', event.target.value)}
              />
            </Field>

            <Field label={`${t('packages.deposit')} (${DEFAULT_CURRENCY})`}>
              <Input
                type="number"
                min={0}
                value={form.depositAmount}
                onChange={(event) => set('depositAmount', event.target.value)}
              />
            </Field>

            <Field label={t('packages.paymentDue')}>
              <Input
                type="date"
                value={form.paymentDueDate}
                onChange={(event) => set('paymentDueDate', event.target.value)}
              />
            </Field>

            <Field label={t('packages.description')} className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
              />
            </Field>

            <Field label={t('packages.inclusions')} hint="One per line">
              <Textarea
                rows={5}
                value={form.inclusions}
                onChange={(event) => set('inclusions', event.target.value)}
                placeholder={'Return flights\nUmrah visa\nHotel'}
              />
            </Field>

            <Field label={t('packages.exclusions')} hint="One per line">
              <Textarea
                rows={5}
                value={form.exclusions}
                onChange={(event) => set('exclusions', event.target.value)}
                placeholder={'Personal expenses\nTravel insurance'}
              />
            </Field>

            <Field label={t('packages.itinerary')} className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.itinerary}
                onChange={(event) => set('itinerary', event.target.value)}
              />
            </Field>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{initial ? t('common.saveChanges') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-medium">
        <span>{label}</span>
        {hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}
      </Label>
      {children}
    </div>
  );
}

/** All fields are strings — controlled inputs and `<input type="number">` both hand back strings. */
interface FormState {
  name: string;
  type: TravelPackage['type'];
  status: TravelPackage['status'];
  destination: string;
  departureDate: string;
  returnDate: string;
  pricePerPilgrim: string;
  capacity: string;
  depositAmount: string;
  paymentDueDate: string;
  description: string;
  inclusions: string;
  exclusions: string;
  itinerary: string;
}

function toFormState(pkg?: TravelPackage): FormState {
  return {
    name: pkg?.name ?? '',
    type: pkg?.type ?? 'UMRAH',
    status: pkg?.status ?? 'DRAFT',
    destination: pkg?.destination ?? '',
    departureDate: pkg?.departureDate ?? '',
    returnDate: pkg?.returnDate ?? '',
    pricePerPilgrim: pkg ? String(toMajorUnits(pkg.pricePerPilgrim)) : '',
    capacity: pkg ? String(pkg.capacity) : '',
    depositAmount: pkg ? String(toMajorUnits(pkg.depositAmount)) : '',
    paymentDueDate: pkg?.paymentDueDate ?? '',
    description: pkg?.description ?? '',
    inclusions: pkg?.inclusions.join('\n') ?? '',
    exclusions: pkg?.exclusions.join('\n') ?? '',
    itinerary: pkg?.itinerary ?? '',
  };
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
