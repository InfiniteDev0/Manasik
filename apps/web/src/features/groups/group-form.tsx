'use client';

import type { DepartureGroup } from '@manasik/types';
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
import { formatDate } from '@/lib/dates';
import { statusLabel, t } from '@/lib/strings';
import { listGuides, listPackages } from '@/mocks/queries';
import { createGroup, updateGroup, useMockQuery, type GroupInput } from '@/mocks/store';

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DepartureGroup;
}

const GROUP_STATUSES = ['PLANNING', 'OPEN', 'READY', 'TRAVELLING', 'COMPLETED'] as const;

export function GroupForm({ open, onOpenChange, initial }: GroupFormProps) {
  const packages = useMockQuery(listPackages);
  const guides = useMockQuery(listGuides);

  const [form, setForm] = React.useState<GroupInput>(() => toFormState(initial));
  const [error, setError] = React.useState<string | null>(null);

  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  React.useEffect(() => {
    if (!open) return;
    setForm(toFormState(initialRef.current));
    setError(null);
  }, [open, initial?.id]);

  function set<K extends keyof GroupInput>(key: K, value: GroupInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Give the group a name.');
      return;
    }
    if (!form.packageId) {
      setError('A group belongs to one package — choose it.');
      return;
    }
    if (form.returnDate && form.departureDate && form.returnDate < form.departureDate) {
      setError('The return date cannot be before departure.');
      return;
    }

    const input: GroupInput = { ...form, name: form.name.trim() };

    if (initial) {
      updateGroup(initial.id, input);
    } else {
      createGroup(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('groups.edit') : t('groups.create')}</DialogTitle>
          <DialogDescription>{t('groups.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.name')}</Label>
              <Input
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="Ramadan Umrah — March 2027 — Group A"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.package')}</Label>
              <Select
                value={form.packageId}
                onValueChange={(value: unknown) => {
                  const next = String(value);
                  set('packageId', next);

                  // Default the dates from the package so staff are not
                  // retyping what the trip already fixes. They stay editable —
                  // a second group often departs a week later.
                  const pkg = packages.find((p) => p.id === next);
                  if (pkg && !initial) {
                    setForm((previous) => ({
                      ...previous,
                      packageId: next,
                      departureDate: pkg.departureDate,
                      returnDate: pkg.returnDate,
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} — {formatDate(pkg.departureDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('groups.departureDate')}</Label>
              <Input
                type="date"
                value={form.departureDate}
                onChange={(event) => set('departureDate', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('groups.returnDate')}</Label>
              <Input
                type="date"
                value={form.returnDate}
                onChange={(event) => set('returnDate', event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('groups.capacity')}</Label>
              <Input
                type="number"
                min={0}
                value={String(form.capacity)}
                onChange={(event) => set('capacity', Number(event.target.value) || 0)}
              />
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('groups.guide')}</Label>
              <Select
                value={form.guideId ?? '__none__'}
                onValueChange={(value: unknown) =>
                  set('guideId', value === '__none__' ? null : String(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('groups.noGuide')}</SelectItem>
                  {guides.map((guide) => (
                    <SelectItem key={guide.id} value={guide.id}>
                      {guide.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('common.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(value: unknown) => set('status', value as GroupInput['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 text-xs font-medium">{t('groups.meetingPoint')}</Label>
              <Input
                value={form.meetingPoint}
                onChange={(event) => set('meetingPoint', event.target.value)}
                placeholder="JKIA Terminal 1A, 4 hours before departure"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.flightNotes')}</Label>
              <Textarea
                rows={2}
                value={form.flightNotes}
                onChange={(event) => set('flightNotes', event.target.value)}
                placeholder="Kenya Airways KQ310 NBO→JED, 09:15. Return KQ311."
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.hotelNotes')}</Label>
              <Textarea
                rows={2}
                value={form.hotelNotes}
                onChange={(event) => set('hotelNotes', event.target.value)}
                placeholder="Elaf Ajyad, Makkah (7 nights) · Dar Al Iman, Madinah (5 nights)"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.transportNotes')}</Label>
              <Textarea
                rows={2}
                value={form.transportNotes}
                onChange={(event) => set('transportNotes', event.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.itinerary')}</Label>
              <Textarea
                rows={2}
                value={form.itinerary}
                onChange={(event) => set('itinerary', event.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-medium">{t('groups.notes')}</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
              />
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

function toFormState(group?: DepartureGroup): GroupInput {
  return {
    name: group?.name ?? '',
    packageId: group?.packageId ?? '',
    departureDate: group?.departureDate ?? '',
    returnDate: group?.returnDate ?? '',
    capacity: group?.capacity ?? 20,
    guideId: group?.guideId ?? null,
    status: group?.status ?? 'PLANNING',
    meetingPoint: group?.meetingPoint ?? '',
    itinerary: group?.itinerary ?? '',
    hotelNotes: group?.hotelNotes ?? '',
    transportNotes: group?.transportNotes ?? '',
    flightNotes: group?.flightNotes ?? '',
    notes: group?.notes ?? '',
  };
}
