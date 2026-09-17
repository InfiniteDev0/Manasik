'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

/** The dashboard's time range. UI only for now — the figures are placeholders. */
export function PeriodSelect() {
  return (
    // `items` lets the trigger show "This Month" rather than the raw value.
    <Select items={PERIODS} defaultValue="month">
      <SelectTrigger
        aria-label="Time range"
        className="h-10 rounded-xl border-0 bg-white pr-3 pl-4 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((period) => (
          <SelectItem key={period.value} value={period.value}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
