'use client';

import { SearchIcon, XIcon } from 'lucide-react';

import { DatePicker, type DatePickerValue } from '@/components/date-picker';
import { cn } from '@/lib/utils';

import { TICKET_CATEGORIES } from './tickets-data';

// ─── Tabs ────────────────────────────────────────────────────────────────────

interface TicketsTabsProps {
  value: string;
  onValueChange: (categoryId: string) => void;
  /** Tickets per category id. */
  counts: Record<string, number>;
}

/**
 * Rounded, browser-style tabs across the top of the table card — one per ticket
 * category. The active tab opens into the card below it.
 */
export function TicketsTabs({ value, onValueChange, counts }: TicketsTabsProps) {
  return (
    <div role="tablist" aria-label="Ticket categories" className="bg-muted/50 flex items-end gap-1 border-b px-2 pt-2">
      {TICKET_CATEGORIES.map((category) => {
        const active = category.id === value;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(category.id)}
            className={cn(
              // -mb-px lays the tab over the strip's bottom border, so the active
              // one (bottom border in the card colour) joins the card seamlessly.
              'relative -mb-px flex h-10 shrink-0 items-center gap-2 rounded-t-xl border px-4 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
              active
                ? 'bg-card text-foreground border-border border-b-card font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
            )}
          >
            {category.label}
            <span className="bg-muted text-muted-foreground rounded-md border px-1.5 text-xs leading-5 font-normal tabular-nums">
              {counts[category.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Search + date ───────────────────────────────────────────────────────────

const OUTLINE_CLASS =
  'border-border bg-card text-foreground inline-flex h-9 items-center rounded-lg border text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30';

function TicketsSearch({ value, onChange }: { value: string; onChange: (query: string) => void }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <input
        type="search"
        aria-label="Search tickets"
        placeholder="Search tickets"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onChange('');
        }}
        className={cn(
          OUTLINE_CLASS,
          'placeholder:text-muted-foreground w-full pe-9 ps-9 [&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

interface TicketsToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  dateFilter: DatePickerValue;
  onDateFilterChange: (value: DatePickerValue) => void;
}

/** Search on the left; the date picker (by the ticket's date) on the right. */
export function TicketsToolbar({
  searchQuery,
  onSearchQueryChange,
  dateFilter,
  onDateFilterChange,
}: TicketsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      <TicketsSearch value={searchQuery} onChange={onSearchQueryChange} />
      <DatePicker value={dateFilter} onChange={onDateFilterChange} align="end" className="bg-card h-9 shadow-xs" />
    </div>
  );
}
