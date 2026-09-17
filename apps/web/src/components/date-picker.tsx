'use client';

import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/** One day, or a from–to range. `value` is undefined when nothing is picked. */
export type DatePickerValue =
  | { mode: 'single'; value: Date | undefined }
  | { mode: 'range'; value: DateRange | undefined };

export const EMPTY_DATE_PICKER_VALUE: DatePickerValue = { mode: 'range', value: undefined };

/** The whole month `date` falls in, from the 1st to its last day. */
export function getMonthValue(date: Date): DatePickerValue {
  return { mode: 'range', value: { from: startOfMonth(date), to: endOfMonth(date) } };
}

const PRESETS: { label: string; getValue: () => DatePickerValue }[] = [
  { label: 'Today', getValue: () => ({ mode: 'single', value: new Date() }) },
  { label: 'Yesterday', getValue: () => ({ mode: 'single', value: subDays(new Date(), 1) }) },
  {
    label: 'This week',
    getValue: () => ({
      mode: 'range',
      value: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) },
    }),
  },
  {
    label: 'Last week',
    getValue: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return { mode: 'range', value: { from: startOfWeek(lastWeek), to: endOfWeek(lastWeek) } };
    },
  },
  { label: 'This month', getValue: () => getMonthValue(new Date()) },
  { label: 'Last month', getValue: () => getMonthValue(subMonths(new Date(), 1)) },
  {
    label: 'Last 7 days',
    getValue: () => ({ mode: 'range', value: { from: subDays(new Date(), 6), to: new Date() } }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({ mode: 'range', value: { from: subDays(new Date(), 29), to: new Date() } }),
  },
];

function formatLabel(picked: DatePickerValue) {
  if (picked.mode === 'single') {
    return picked.value ? format(picked.value, 'PPP') : 'Pick a date';
  }

  const range = picked.value;
  if (!range?.from) return 'Pick a date';
  if (!range.to) return format(range.from, 'MMM d, yyyy');
  return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
}

interface DatePickerProps {
  value: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DatePicker({ value, onChange, align = 'start', className }: DatePickerProps) {
  const hasValue = value.mode === 'single' ? Boolean(value.value) : Boolean(value.value?.from);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              'w-70 justify-start rounded-md text-left font-normal',
              !hasValue && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon />
        {formatLabel(value)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className="justify-start font-normal"
                onClick={() => onChange(preset.getValue())}
              >
                {preset.label}
              </Button>
            ))}
            {/* Back to "Pick a date" — no date filter. */}
            {hasValue ? (
              <Button
                variant="ghost"
                className="text-muted-foreground mt-auto justify-start font-normal"
                onClick={() => onChange(EMPTY_DATE_PICKER_VALUE)}
              >
                Clear
              </Button>
            ) : null}
          </div>
          {value.mode === 'single' ? (
            <Calendar
              mode="single"
              selected={value.value}
              onSelect={(date) => date && onChange({ mode: 'single', value: date })}
            />
          ) : (
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={value.value}
              onSelect={(range) => onChange({ mode: 'range', value: range })}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
