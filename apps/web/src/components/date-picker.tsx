'use client';

import {
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
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

/**
 * Whether a stored `yyyy-mm-dd` day is the picked day, or inside the picked
 * range. Nothing picked matches everything; an empty day matches nothing.
 */
export function matchesDateRange(value: string, picked: DatePickerValue): boolean {
  if (picked.mode === 'single') {
    return !picked.value || value === format(picked.value, 'yyyy-MM-dd');
  }
  const range = picked.value;
  if (!range?.from) {
    return true;
  }
  const from = format(range.from, 'yyyy-MM-dd');
  // Only a start picked so far (mid-selection): just that day.
  const to = range.to ? format(range.to, 'yyyy-MM-dd') : from;
  return value >= from && value <= to;
}

/** The whole month `date` falls in, from the 1st to its last day. */
export function getMonthValue(date: Date): DatePickerValue {
  return { mode: 'range', value: { from: startOfMonth(date), to: endOfMonth(date) } };
}

// The viewer's month as "yyyy-MM". The server doesn't know the viewer's
// timezone, so it renders without one (null) and the browser fills it in on
// hydration — otherwise the two could disagree on the last day of a month.
const subscribeNever = () => () => {};
const getCurrentMonth = () => format(new Date(), 'yyyy-MM');
const getNoMonth = () => null;

/**
 * A table's date filter: the viewer's current month until something else is
 * picked (or cleared).
 */
export function useMonthDateFilter(): [DatePickerValue, (value: DatePickerValue) => void] {
  const [picked, setPicked] = React.useState<DatePickerValue | null>(null);
  const currentMonth = React.useSyncExternalStore(subscribeNever, getCurrentMonth, getNoMonth);
  const thisMonth = React.useMemo(
    () => (currentMonth ? getMonthValue(parse(currentMonth, 'yyyy-MM', new Date())) : EMPTY_DATE_PICKER_VALUE),
    [currentMonth],
  );
  return [picked ?? thisMonth, setPicked];
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

interface SingleDatePickerProps {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

/** One day, picked from a calendar that closes on the click, like a select. */
export function SingleDatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
          />
        }
      >
        <CalendarIcon />
        {value ? format(value, 'MMM d, yyyy') : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          autoFocus
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const toDay = (value: string) => (value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined);
const fromDay = (date: Date) => format(date, 'yyyy-MM-dd');

/** "Sep 24 → Oct 8, 2026", "Dec 28, 2026 → Jan 5, 2027", "Sep 24, 2026 · No return"… */
function tripLabel(departure: string, returnDate: string, roundTrip: boolean): string | null {
  const out = toDay(departure);
  if (!out) return null;
  const back = toDay(returnDate);
  if (back) {
    const sameYear = out.getFullYear() === back.getFullYear();
    return `${format(out, sameYear ? 'MMM d' : 'MMM d, yyyy')} → ${format(back, 'MMM d, yyyy')}`;
  }
  return `${format(out, 'MMM d, yyyy')} ${roundTrip ? '→ …' : '· No return'}`;
}

interface TripDatePickerProps {
  id?: string;
  /** `yyyy-mm-dd`, or '' before one is picked. */
  departure: string;
  /** `yyyy-mm-dd`, or '' for no return (a one-way trip). */
  returnDate: string;
  onChange: (departure: string, returnDate: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Departure and return in one calendar: pick the day out, then the day back.
 * For a one-way trip, switch to No return and pick just the departure.
 */
export function TripDatePicker({
  id,
  departure,
  returnDate,
  onChange,
  placeholder = 'Departure — return',
  className,
}: TripDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  // A saved trip with a departure but no return is one-way; a new one starts as a return trip.
  const [roundTrip, setRoundTrip] = React.useState(Boolean(returnDate) || !departure);
  const label = tripLabel(departure, returnDate, roundTrip);
  const out = toDay(departure);

  const switchTo = (next: boolean) => {
    setRoundTrip(next);
    if (!next && returnDate) onChange(departure, '');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn('w-full justify-start font-normal', !label && 'text-muted-foreground', className)}
          />
        }
      >
        <CalendarIcon />
        <span className="truncate">{label ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align="start">
        <div className="flex items-center justify-between gap-4 border-b p-2">
          <div className="bg-muted flex rounded-lg p-0.5" role="group" aria-label="Trip type">
            {[
              { value: true, label: 'Return' },
              { value: false, label: 'No return' },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={roundTrip === option.value}
                onClick={() => switchTo(option.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs transition-colors',
                  roundTrip === option.value
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground pe-1 text-xs">
            {roundTrip ? 'Pick the day out, then the day back' : 'Pick the day out'}
          </span>
        </div>

        {roundTrip ? (
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={out}
            selected={{ from: out, to: toDay(returnDate) }}
            onSelect={(range) => {
              const from = range?.from;
              // The first click can come back as a one-day range; that's just the departure.
              const to = from && range?.to && range.to > from ? range.to : undefined;
              onChange(from ? fromDay(from) : '', to ? fromDay(to) : '');
              if (to) setOpen(false);
            }}
          />
        ) : (
          <Calendar
            mode="single"
            defaultMonth={out}
            selected={out}
            onSelect={(date) => {
              if (!date) return;
              onChange(fromDay(date), '');
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function formatLabel(picked: DatePickerValue) {
  if (picked.mode === 'single') {
    return picked.value ? format(picked.value, 'PPP') : 'Pick a date';
  }

  const range = picked.value;
  if (!range?.from) return 'Pick a date';
  if (!range.to) return format(range.from, 'MMM d, yyyy');
  return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
}

/** A date the range can be matched against, e.g. when it was created or when it departs. */
export interface DatePickerScope {
  id: string;
  label: string;
}

interface DatePickerProps {
  value: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
  /** Optional: which date the range applies to, switched at the top of the popover. */
  scopes?: DatePickerScope[];
  scope?: string;
  onScopeChange?: (id: string) => void;
}

export function DatePicker({
  value,
  onChange,
  align = 'start',
  className,
  scopes,
  scope,
  onScopeChange,
}: DatePickerProps) {
  const hasValue = value.mode === 'single' ? Boolean(value.value) : Boolean(value.value?.from);
  // The first scope is the usual one, so only the others are named on the button.
  const activeScope = scopes?.find((option) => option.id === scope);
  const scopeLabel = activeScope && scopes?.[0]?.id !== activeScope.id ? `${activeScope.label}: ` : '';

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
        <span className="truncate">
          {scopeLabel}
          {formatLabel(value)}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {scopes && scopes.length > 1 ? (
              // Which date the range applies to.
              <div className="bg-muted mb-1 flex rounded-lg p-0.5">
                {scopes.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onScopeChange?.(option.id)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1 text-xs transition-colors',
                      option.id === scope
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

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
