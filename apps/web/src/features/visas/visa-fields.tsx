'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { VISA_STATUSES, visaStatusLabel, type VisaStatus } from './visas-data';

// Shared between the create form above the table and the edit panel.

/** The visa's status as a coloured pill. */
export function VisaStatusBadge({ status }: { status: VisaStatus }) {
  const option = VISA_STATUSES.find((entry) => entry.id === status);
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium',
        option?.className ?? 'bg-muted text-muted-foreground',
      )}
    >
      {option?.label ?? status}
    </span>
  );
}

interface VisaStatusSelectProps {
  id: string;
  value: VisaStatus;
  onValueChange: (status: VisaStatus) => void;
  className?: string;
}

export function VisaStatusSelect({ id, value, onValueChange, className }: VisaStatusSelectProps) {
  return (
    <Select value={value} onValueChange={(next: string | null) => next && onValueChange(next as VisaStatus)}>
      <SelectTrigger id={id} className={cn('h-9 w-full', className)}>
        <SelectValue>{visaStatusLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {VISA_STATUSES.map((status) => (
          <SelectItem key={status.id} value={status.id}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A label above a field, the same in both the form and the panel. */
export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
      {children}
    </Label>
  );
}
