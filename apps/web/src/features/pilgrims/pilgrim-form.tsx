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
import { enumLabel, statusLabel, t } from '@/lib/strings';
import type { MockPilgrim } from '@/mocks/data';
import { createPilgrim, updatePilgrim, type PilgrimInput } from '@/mocks/store';

interface PilgrimFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MockPilgrim;
}

const PILGRIM_STATUSES = [
  'LEAD',
  'REGISTERED',
  'CONFIRMED',
  'TRAVELLING',
  'COMPLETED',
  'CANCELLED',
] as const;

const VISA_STATUSES = ['NOT_STARTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;

/**
 * Create/edit dialog for a pilgrim.
 *
 * <p>Grouped into three sections rather than one long column. Twenty-odd
 * fields in an undifferentiated list is where data entry starts going wrong —
 * the emergency contact in particular gets skipped when it does not visibly
 * announce itself as its own thing.
 */
export function PilgrimForm({ open, onOpenChange, initial }: PilgrimFormProps) {
  const [form, setForm] = React.useState(() => toFormState(initial));
  const [error, setError] = React.useState<string | null>(null);

  // Keyed on the record's id, not the object. `initial` comes from a derived
  // query and is a new object every render, so depending on it would re-seed
  // the form on each keystroke and discard whatever was being typed.
  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  React.useEffect(() => {
    if (!open) return;
    setForm(toFormState(initialRef.current));
    setError(null);
  }, [open, initial?.id]);

  function set<K extends keyof PilgrimInput>(key: K, value: PilgrimInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setError('A full name is required.');
      return;
    }
    if (!form.phone.trim()) {
      setError('A phone number is required — it is how the agency reaches them.');
      return;
    }

    const input: PilgrimInput = {
      ...form,
      fullName: form.fullName.trim(),
      arabicName: form.arabicName?.trim() || null,
      email: form.email?.trim() || null,
      passportNumber: form.passportNumber?.trim() || null,
      passportExpiry: form.passportExpiry || null,
    };

    if (initial) {
      updatePilgrim(initial.id, input);
    } else {
      createPilgrim(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? t('pilgrims.edit') : t('pilgrims.create')}</DialogTitle>
          <DialogDescription>{t('pilgrims.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Personal">
            <Field label={t('pilgrims.fullName')} className="sm:col-span-2">
              <Input
                value={form.fullName}
                onChange={(event) => set('fullName', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.arabicName')} className="sm:col-span-2">
              <Input
                dir="rtl"
                value={form.arabicName ?? ''}
                onChange={(event) => set('arabicName', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.gender')}>
              <Select
                value={form.gender}
                onValueChange={(value: unknown) => set('gender', value as MockPilgrim['gender'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{enumLabel('MALE')}</SelectItem>
                  <SelectItem value="FEMALE">{enumLabel('FEMALE')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('pilgrims.dateOfBirth')}>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => set('dateOfBirth', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.nationality')}>
              <Input
                value={form.nationality}
                onChange={(event) => set('nationality', event.target.value)}
                placeholder="KE"
              />
            </Field>

            <Field label={t('pilgrims.pilgrimageType')}>
              <Select
                value={form.pilgrimageType}
                onValueChange={(value: unknown) =>
                  set('pilgrimageType', value as MockPilgrim['pilgrimageType'])
                }
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
          </Section>

          <Section title="Contact">
            <Field label={t('pilgrims.phone')}>
              <Input value={form.phone} onChange={(event) => set('phone', event.target.value)} />
            </Field>

            <Field label={t('pilgrims.email')}>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(event) => set('email', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.city')}>
              <Input value={form.city} onChange={(event) => set('city', event.target.value)} />
            </Field>

            <Field label={t('pilgrims.country')}>
              <Input
                value={form.country}
                onChange={(event) => set('country', event.target.value)}
              />
            </Field>
          </Section>

          <Section title={t('pilgrims.emergencyContact')}>
            <Field label={t('pilgrims.emergencyContactName')}>
              <Input
                value={form.emergencyContactName}
                onChange={(event) => set('emergencyContactName', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.emergencyContactPhone')}>
              <Input
                value={form.emergencyContactPhone}
                onChange={(event) => set('emergencyContactPhone', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.emergencyContactRelation')} className="sm:col-span-2">
              <Input
                value={form.emergencyContactRelation}
                onChange={(event) => set('emergencyContactRelation', event.target.value)}
                placeholder="Wife, brother, son…"
              />
            </Field>
          </Section>

          <Section title="Travel documents">
            <Field label={t('pilgrims.passportNumber')}>
              <Input
                value={form.passportNumber ?? ''}
                onChange={(event) => set('passportNumber', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.passportExpiry')}>
              <Input
                type="date"
                value={form.passportExpiry ?? ''}
                onChange={(event) => set('passportExpiry', event.target.value)}
              />
            </Field>

            <Field label={t('pilgrims.visaStatus')}>
              <Select
                value={form.visaStatus}
                onValueChange={(value: unknown) =>
                  set('visaStatus', value as MockPilgrim['visaStatus'])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISA_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('common.status')}>
              <Select
                value={form.status}
                onValueChange={(value: unknown) => set('status', value as MockPilgrim['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILGRIM_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Notes">
            <Field label={t('pilgrims.medicalNotes')} className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.medicalNotes}
                onChange={(event) => set('medicalNotes', event.target.value)}
                placeholder="Conditions, medication, mobility needs…"
              />
            </Field>

            <Field label={t('pilgrims.specialRequirements')} className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.specialRequirements}
                onChange={(event) => set('specialRequirements', event.target.value)}
                placeholder="Room preferences, dietary needs, travelling companions…"
              />
            </Field>
          </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function toFormState(pilgrim?: MockPilgrim): PilgrimInput {
  return {
    fullName: pilgrim?.fullName ?? '',
    arabicName: pilgrim?.arabicName ?? null,
    gender: pilgrim?.gender ?? 'MALE',
    dateOfBirth: pilgrim?.dateOfBirth ?? '',
    nationality: pilgrim?.nationality ?? 'KE',
    email: pilgrim?.email ?? null,
    phone: pilgrim?.phone ?? '',
    city: pilgrim?.city ?? '',
    country: pilgrim?.country ?? 'KE',
    emergencyContactName: pilgrim?.emergencyContactName ?? '',
    emergencyContactPhone: pilgrim?.emergencyContactPhone ?? '',
    emergencyContactRelation: pilgrim?.emergencyContactRelation ?? '',
    passportNumber: pilgrim?.passportNumber ?? null,
    passportExpiry: pilgrim?.passportExpiry ?? null,
    visaStatus: pilgrim?.visaStatus ?? 'NOT_STARTED',
    pilgrimageType: pilgrim?.pilgrimageType ?? 'UMRAH',
    // New records start as leads: nobody is "confirmed" the moment they are typed in.
    status: pilgrim?.status ?? 'LEAD',
    medicalNotes: pilgrim?.medicalNotes ?? '',
    specialRequirements: pilgrim?.specialRequirements ?? '',
    photoUrl: pilgrim?.photoUrl ?? null,
  };
}
