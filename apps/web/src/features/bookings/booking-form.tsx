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
import { formatDate, todayIso } from '@/lib/dates';
import { DEFAULT_CURRENCY, formatMoney, toMajorUnits, toMinorUnits } from '@/lib/money';
import { statusLabel, t } from '@/lib/strings';
import { listGroups, listPackages, listPilgrims, type BookingRow } from '@/mocks/queries';
import { createBooking, updateBooking, useMockQuery, type BookingInput } from '@/mocks/store';

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: BookingRow;
  /** Pre-selects a pilgrim when opened from that pilgrim's page. */
  defaultPilgrimId?: string;
}

/**
 * Create/edit dialog for a booking.
 *
 * <p>Shows a live price summary as the package and discount change. Booking is
 * the moment money is committed, and staff should not have to open a
 * calculator to see what the pilgrim will owe.
 */
export function BookingForm({
  open,
  onOpenChange,
  initial,
  defaultPilgrimId,
}: BookingFormProps) {
  const pilgrims = useMockQuery(listPilgrims);
  const packages = useMockQuery(listPackages);
  const groups = useMockQuery(listGroups);

  const [form, setForm] = React.useState<FormState>(() => toFormState(initial, defaultPilgrimId));
  const [error, setError] = React.useState<string | null>(null);

  // Keyed on the record's id, not the object. `initial` comes from a derived
  // query and is a new object every render, so depending on it would re-seed
  // the form on each keystroke and discard whatever was being typed.
  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  React.useEffect(() => {
    if (!open) return;
    setForm(toFormState(initialRef.current, defaultPilgrimId));
    setError(null);
  }, [open, initial?.id, defaultPilgrimId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  const selectedPackage = packages.find((pkg) => pkg.id === form.packageId);
  // On edit the price is whatever was locked in at booking time — a later
  // package price change must not silently reprice an existing booking.
  const basePrice = initial ? initial.packagePrice : (selectedPackage?.pricePerPilgrim ?? 0);
  const discount = toMinorUnits(Number(form.discount) || 0);
  const total = Math.max(basePrice - discount, 0);

  // Only groups on the same package can accept this booking.
  const eligibleGroups = groups.filter(
    (group) => group.packageId === form.packageId && group.status !== 'COMPLETED',
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.pilgrimId) {
      setError('Choose a pilgrim.');
      return;
    }
    if (!form.packageId) {
      setError('Choose a package.');
      return;
    }
    if (discount > basePrice) {
      setError('The discount is larger than the package price.');
      return;
    }

    const input: BookingInput = {
      pilgrimId: form.pilgrimId,
      packageId: form.packageId,
      bookingDate: form.bookingDate || todayIso(),
      discount,
      groupId: form.groupId || null,
      notes: form.notes.trim(),
      status: form.status,
    };

    if (initial) {
      updateBooking(initial.id, input);
    } else {
      createBooking(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('bookings.edit') : t('bookings.create')}</DialogTitle>
          <DialogDescription>{t('bookings.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('bookings.pilgrim')}</Label>
              <Select
                value={form.pilgrimId}
                onValueChange={(value: unknown) => set('pilgrimId', String(value))}
                // The pilgrim a booking belongs to is not an editable
                // attribute — moving one would silently transfer payments.
                disabled={Boolean(initial)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a pilgrim" />
                </SelectTrigger>
                <SelectContent>
                  {pilgrims.map((pilgrim) => (
                    <SelectItem key={pilgrim.id} value={pilgrim.id}>
                      {pilgrim.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('bookings.package')}</Label>
              <Select
                value={form.packageId}
                onValueChange={(value: unknown) => {
                  set('packageId', String(value));
                  // A group belongs to one package; keeping the old selection
                  // would attach the booking to a group on a different trip.
                  set('groupId', '');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages
                    .filter((pkg) => pkg.status === 'ACTIVE' || pkg.id === form.packageId)
                    .map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} — {formatDate(pkg.departureDate)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPackage && selectedPackage.seatsRemaining === 0 && !initial ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  This package is full — the booking will oversubscribe it.
                </p>
              ) : null}
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('bookings.bookingDate')}</Label>
              <Input
                type="date"
                value={form.bookingDate}
                onChange={(event) => set('bookingDate', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">
                {t('bookings.discount')} ({DEFAULT_CURRENCY})
              </Label>
              <Input
                type="number"
                min={0}
                value={form.discount}
                onChange={(event) => set('discount', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('common.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(value: unknown) => set('status', value as FormState['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('bookings.group')}</Label>
              <Select
                value={form.groupId || '__none__'}
                onValueChange={(value: unknown) =>
                  set('groupId', value === '__none__' ? '' : String(value))
                }
                disabled={!form.packageId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('bookings.unassigned')}</SelectItem>
                  {eligibleGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('bookings.notes')}</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
              />
            </div>
          </div>

          {/* Live total — recomputed from the same rule the invoice uses. */}
          <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('bookings.packagePrice')}</span>
              <span className="tabular-nums">{formatMoney(basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('bookings.discount')}</span>
              <span className="tabular-nums">−{formatMoney(discount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-medium">
              <span>{t('bookings.total')}</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
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

interface FormState {
  pilgrimId: string;
  packageId: string;
  bookingDate: string;
  discount: string;
  groupId: string;
  notes: string;
  status: BookingInput['status'];
}

function toFormState(booking?: BookingRow, defaultPilgrimId?: string): FormState {
  return {
    pilgrimId: booking?.pilgrimId ?? defaultPilgrimId ?? '',
    packageId: booking?.packageId ?? '',
    bookingDate: booking?.bookingDate ?? todayIso(),
    discount: booking ? String(toMajorUnits(booking.discount)) : '0',
    groupId: booking?.groupId ?? '',
    notes: booking?.notes ?? '',
    status: booking?.status ?? 'PENDING',
  };
}
