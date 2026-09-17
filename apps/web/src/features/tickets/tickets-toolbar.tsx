'use client';

import { DatePicker, type DatePickerScope, type DatePickerValue } from '@/components/date-picker';
import { TableSearch } from '@/components/table-parts';

import type { TicketDateField } from './tickets-data';

/** The picker can filter on either of the ticket's two dates. */
const DATE_SCOPES: DatePickerScope[] = [
  { id: 'date', label: 'Created' },
  { id: 'departure', label: 'Departure' },
];

interface TicketsToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  dateFilter: DatePickerValue;
  onDateFilterChange: (value: DatePickerValue) => void;
  dateField: TicketDateField;
  onDateFieldChange: (field: TicketDateField) => void;
}

/** Search on the left; the date picker on the right. */
export function TicketsToolbar({
  searchQuery,
  onSearchQueryChange,
  dateFilter,
  onDateFilterChange,
  dateField,
  onDateFieldChange,
}: TicketsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      <TableSearch
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder="Search tickets"
        label="Search tickets"
      />
      <DatePicker
        value={dateFilter}
        onChange={onDateFilterChange}
        align="end"
        className="bg-card h-9 shadow-xs"
        scopes={DATE_SCOPES}
        scope={dateField}
        onScopeChange={(id) => onDateFieldChange(id as TicketDateField)}
      />
    </div>
  );
}
