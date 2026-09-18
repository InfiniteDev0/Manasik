'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortDirection,
  useReactTable,
} from '@tanstack/react-table';
import { format, parse } from 'date-fns';
import { gooeyToast } from 'goey-toast';
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import * as React from 'react';

import { EMPTY_DATE_PICKER_VALUE, getMonthValue, type DatePickerValue } from '@/components/date-picker';
import { InversePanel, SectionHeader, SelectionBar, TableTabs } from '@/components/table-parts';
import { Checkbox } from '@/components/ui/checkbox';
import { formatMoney } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatDayLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

import { TicketForm } from './ticket-form';
import { TicketSheet } from './ticket-sheet';
import {
  SAMPLE_TICKETS,
  TICKET_CATEGORIES,
  ticketMatchesDate,
  ticketMatchesSearch,
  type TicketDateField,
  type TicketRow,
} from './tickets-data';
import { TicketsToolbar } from './tickets-toolbar';

// ─── Cells ───────────────────────────────────────────────────────────────────

/** A bold first line with a muted second line underneath. */
function TwoLineCell({ primary, secondary }: { primary: React.ReactNode; secondary: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-foreground truncate font-medium">{primary}</p>
      <p className="text-muted-foreground truncate text-xs">{secondary}</p>
    </div>
  );
}

function ClientCell({ ticket }: { ticket: TicketRow }) {
  const initials = ticket.client
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-3">
      <span className="bg-vivid-cyan/10 text-vivid-cyan flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {initials || '?'}
      </span>
      <TwoLineCell primary={ticket.client || 'Unnamed'} secondary={ticket.phone || 'No phone'} />
    </div>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

// Phone, route, return, ref and currency are shown inside other columns, so
// their own columns stay hidden — but they still exist for the CSV export.
const HIDDEN_COLUMNS = { phone: false, route: false, returnDate: false, reference: false, currency: false };

function hiddenColumn(
  id: 'phone' | 'route' | 'returnDate' | 'reference' | 'currency',
  label: string,
): ColumnDef<TicketRow> {
  return {
    id,
    accessorKey: id,
    header: label,
    meta: { label, cell: { variant: 'short-text' } },
    enableSorting: false,
  };
}

function moneyColumn(id: 'collected' | 'commission' | 'net', label: string): ColumnDef<TicketRow> {
  return {
    id,
    accessorKey: id,
    header: label,
    meta: { label, cell: { variant: 'number', min: 0, step: 0.01 } },
    cell: ({ row }) => (
      // The commission — what the agency keeps — stands out.
      <span className={cn('tabular-nums', id === 'commission' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
        {formatMoney(row.original[id], row.original.currency)}
      </span>
    ),
  };
}

const COLUMNS: ColumnDef<TicketRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all tickets"
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select ticket"
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'client',
    accessorKey: 'client',
    header: 'Client',
    meta: { label: 'Client', cell: { variant: 'short-text' } },
    cell: ({ row }) => <ClientCell ticket={row.original} />,
  },
  hiddenColumn('phone', 'Phone'),
  {
    id: 'airline',
    accessorKey: 'airline',
    header: 'Airline',
    meta: { label: 'Airline', cell: { variant: 'short-text' } },
    cell: ({ row }) => (
      <TwoLineCell primary={row.original.airline || '—'} secondary={row.original.route || 'No route'} />
    ),
  },
  hiddenColumn('route', 'Route'),
  {
    id: 'departure',
    accessorKey: 'departure',
    header: 'Departure',
    meta: { label: 'Departure', cell: { variant: 'date' } },
    cell: ({ row }) =>
      row.original.departure ? (
        <TwoLineCell
          primary={formatDayLabel(row.original.departure)}
          secondary={row.original.returnDate ? `Return ${formatDayLabel(row.original.returnDate)}` : 'No return'}
        />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  hiddenColumn('returnDate', 'Return'),
  hiddenColumn('currency', 'Currency'),
  // Collected from the client − net sent to the airline = the commission.
  moneyColumn('collected', 'Collected'),
  moneyColumn('net', 'Net (airline)'),
  moneyColumn('commission', 'Commission'),
  {
    id: 'pnr',
    accessorKey: 'pnr',
    header: 'PNR',
    meta: { label: 'PNR', cell: { variant: 'short-text' } },
    enableSorting: false,
    cell: ({ row }) => (
      <TwoLineCell
        primary={<span className="font-mono tracking-wide uppercase">{row.original.pnr || '—'}</span>}
        secondary={row.original.reference ? `Ref: ${row.original.reference}` : 'No ref'}
      />
    ),
  },
  hiddenColumn('reference', 'Ref'),
  // The day the ticket was issued — filled in on its own, so it sits at the end.
  {
    id: 'date',
    accessorKey: 'date',
    header: 'Date created',
    meta: { label: 'Date created', cell: { variant: 'date' } },
    cell: ({ row }) => <span className="text-muted-foreground">{formatDayLabel(row.original.date)}</span>,
  },
];

function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === 'asc') return <ChevronUpIcon className="text-foreground size-3.5" />;
  if (direction === 'desc') return <ChevronDownIcon className="text-foreground size-3.5" />;
  return <ChevronsUpDownIcon className="size-3.5 opacity-60" />;
}

// ─── Current month ───────────────────────────────────────────────────────────

// The viewer's month as "yyyy-MM". The server doesn't know the viewer's
// timezone, so it renders without one (null) and the browser fills it in on
// hydration — otherwise the two could disagree on the last day of a month.
const subscribeNever = () => () => {};
const getCurrentMonth = () => format(new Date(), 'yyyy-MM');
const getNoMonth = () => null;

// ─── Table ───────────────────────────────────────────────────────────────────

/**
 * The Tickets table: category tabs, search and filters, sortable headers, and
 * rows you can grab anywhere and drag into a new order. Clicking a row opens it
 * for editing. Rows live in local state for now.
 */
export function TicketsTable() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const [data, setData] = React.useState<TicketRow[]>(SAMPLE_TICKETS);
  const [categoryId, setCategoryId] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  // null until a date is picked — until then the filter is the current month.
  const [pickedDate, setPickedDate] = React.useState<DatePickerValue | null>(null);
  // Which date the picker filters on: when the ticket was created, or departure.
  const [dateField, setDateField] = React.useState<TicketDateField>('date');
  const currentMonth = React.useSyncExternalStore(subscribeNever, getCurrentMonth, getNoMonth);
  const thisMonth = React.useMemo(
    () => (currentMonth ? getMonthValue(parse(currentMonth, 'yyyy-MM', new Date())) : EMPTY_DATE_PICKER_VALUE),
    [currentMonth],
  );
  const dateFilter = pickedDate ?? thisMonth;
  // The sheet keeps its last ticket while it animates closed.
  const [sheetTicket, setSheetTicket] = React.useState<{ ticket: TicketRow; isNew: boolean } | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // Letting go of a drag also fires a click on the row; this swallows it.
  const justDraggedRef = React.useRef(false);

  const category = TICKET_CATEGORIES.find(({ id }) => id === categoryId) ?? TICKET_CATEGORIES[0];

  // The tab and the date picker narrow the tickets before the table sees them;
  // the search then runs inside the table.
  const tableData = React.useMemo(
    () =>
      data.filter(
        (ticket) => (!category || category.matches(ticket)) && ticketMatchesDate(ticket, dateFilter, dateField),
      ),
    [data, category, dateFilter, dateField],
  );

  const counts = React.useMemo(
    () => Object.fromEntries(TICKET_CATEGORIES.map(({ id, matches }) => [id, data.filter(matches).length])),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole ticket, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => ticketMatchesSearch(row.original, query),
    initialState: { columnVisibility: HIDDEN_COLUMNS },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedRows = rows.filter((row) => row.getIsSelected());
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  // A sort decides the on-screen order, so dragging is off while one is active.
  const canReorder = table.getState().sorting.length === 0;

  const openSheet = (ticket: TicketRow, isNew: boolean) => {
    setSheetTicket({ ticket, isNew });
    setSheetOpen(true);
  };

  // `nextIds` is the new order of the rows on screen. Their slots in the full
  // list are refilled in that order, so tickets hidden by a tab, search or
  // filter keep their places.
  const onReorder = (nextIds: string[]) => {
    setData((previous) => {
      const byId = new Map(previous.map((ticket) => [ticket.id, ticket]));
      const moving = new Set(nextIds);
      let slot = 0;
      return previous.map((ticket) => {
        if (!moving.has(ticket.id)) return ticket;
        const id = nextIds[slot++];
        return (id && byId.get(id)) || ticket;
      });
    });
  };

  // Deletes with an Undo that puts the tickets back where they were.
  const deleteTickets = (ids: string[]) => {
    const idSet = new Set(ids);
    const removed = data.flatMap((ticket, index) => (idSet.has(ticket.id) ? [{ ticket, index }] : []));
    if (removed.length === 0) return;

    setData((previous) => previous.filter((ticket) => !idSet.has(ticket.id)));
    table.setRowSelection((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([id]) => !idSet.has(id))),
    );

    gooeyToast.success(`${removed.length} ${removed.length === 1 ? 'ticket' : 'tickets'} deleted`, {
      action: {
        label: 'Undo',
        successLabel: 'Restored',
        onClick: () =>
          setData((previous) => {
            const next = [...previous];
            // Ascending original positions, so each insert lands where it was.
            for (const { ticket, index } of removed) {
              if (!next.some((existing) => existing.id === ticket.id)) {
                next.splice(Math.min(index, next.length), 0, ticket);
              }
            }
            return next;
          }),
      },
    });
  };

  const saveTicket = (ticket: TicketRow) => {
    if (sheetTicket?.isNew) {
      // Newest first. The search is cleared so the new ticket isn't hidden by it.
      setData((previous) => [ticket, ...previous]);
      setSearchQuery('');
    } else {
      setData((previous) => previous.map((existing) => (existing.id === ticket.id ? ticket : existing)));
    }
    setSheetOpen(false);
  };

  const createTicket = (ticket: TicketRow) => {
    // Newest first. The search is cleared so the new ticket isn't hidden by it.
    setData((previous) => [ticket, ...previous]);
    setSearchQuery('');
    setAdding(false);
    gooeyToast.success('Ticket created');
  };

  const onlySelected = selectedRows.length === 1 ? selectedRows[0] : undefined;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Tickets"
        description="Track the tickets you issue to clients — who is flying, where, and what was paid."
        addLabel="Add ticket"
        onExport={() => exportTableToCsv(table, `tickets-${formatDateToString(new Date())}.csv`)}
        onAdd={() => setAdding((open) => !open)}
        adding={adding}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs
          tabs={TICKET_CATEGORIES}
          value={categoryId}
          onValueChange={setCategoryId}
          counts={counts}
          label="Ticket categories"
        />
        <TicketsToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setPickedDate}
          dateField={dateField}
          onDateFieldChange={setDateField}
        />

        {/* Add ticket opens this space above the table and pushes the table
            down. Empty for now. Add ticket again closes it. */}
        <AnimatePresence initial={false}>
          {adding ? (
            <motion.div
              key="add-ticket"
              id="add-ticket-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <InversePanel>
                <TicketForm onCreate={createTicket} onCancel={() => setAdding(false)} />
              </InversePanel>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {selectedRows.length > 0 ? (
            <motion.div
              key="selection"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <SelectionBar
                count={selectedRows.length}
                onEdit={onlySelected ? () => openSheet(onlySelected.original, false) : undefined}
                onExport={() =>
                  exportTableToCsv(table, `tickets-selected-${formatDateToString(new Date())}.csv`, selectedRows)
                }
                onDelete={() => deleteTickets(selectedRows.map((row) => row.original.id))}
                onClear={() => table.resetRowSelection()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* overflow-y-hidden: a row dragged past the ends is clipped instead of
            growing a vertical scrollbar mid-drag. */}
        <div className="scrollbar-pill overflow-x-auto overflow-y-hidden border-t">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const numeric = header.column.columnDef.meta?.cell?.variant === 'number';
                    const direction = header.column.getIsSorted();
                    const label = flexRender(header.column.columnDef.header, header.getContext());
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
                        className={cn(
                          'text-muted-foreground h-11 border-b px-4 text-left align-middle text-[13px] font-normal whitespace-nowrap',
                          numeric && 'text-right',
                          header.column.id === 'select' && 'w-12 pe-0',
                        )}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="hover:text-foreground inline-flex items-center gap-1 transition-colors outline-none focus-visible:underline"
                          >
                            {label}
                            <SortIcon direction={direction} />
                          </button>
                        ) : (
                          label
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <Reorder.Group
              as="tbody"
              axis="y"
              values={rows.map((row) => row.id)}
              onReorder={onReorder}
              className="[&>tr:last-child>td]:border-b-0"
            >
              {rows.map((row) => (
                <Reorder.Item
                  key={row.id}
                  as="tr"
                  value={row.id}
                  layout="position"
                  dragListener={canReorder}
                  onDragStart={() => {
                    justDraggedRef.current = true;
                    setDraggingId(row.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setTimeout(() => {
                      justDraggedRef.current = false;
                    });
                  }}
                  onClick={() => {
                    if (!justDraggedRef.current) openSheet(row.original, false);
                  }}
                  onKeyDown={(event: React.KeyboardEvent) => {
                    if (event.key === 'Enter' && event.target === event.currentTarget) {
                      openSheet(row.original, false);
                    }
                  }}
                  tabIndex={0}
                  aria-selected={row.getIsSelected()}
                  className={cn(
                    'relative transition-colors outline-none focus-visible:bg-muted [&>td]:border-b',
                    row.getIsSelected() ? 'bg-vivid-cyan/6' : 'bg-card',
                    'hover:bg-muted',
                    canReorder ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                    // Lifted while dragging: solid cells so the rows it passes stay hidden underneath.
                    draggingId === row.id && 'z-10 shadow-lg [&>td]:bg-card',
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const numeric = cell.column.columnDef.meta?.cell?.variant === 'number';
                    const isSelect = cell.column.id === 'select';
                    return (
                      <td
                        key={cell.id}
                        // The checkbox toggles selection only — it doesn't open the ticket.
                        onClick={isSelect ? (event) => event.stopPropagation() : undefined}
                        onKeyDown={isSelect ? (event) => event.stopPropagation() : undefined}
                        className={cn(
                          'h-16 px-4 align-middle whitespace-nowrap',
                          numeric && 'text-right',
                          isSelect && 'w-12 pe-0',
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </Reorder.Item>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="text-muted-foreground h-32 text-center text-sm">
                    {data.length === 0 ? 'No tickets yet.' : 'No tickets match.'}
                  </td>
                </tr>
              ) : null}
            </Reorder.Group>
          </table>
        </div>
      </div>

      <TicketSheet
        open={sheetOpen}
        ticket={sheetTicket?.ticket ?? null}
        isNew={sheetTicket?.isNew ?? false}
        onClose={() => setSheetOpen(false)}
        onSave={saveTicket}
        onDelete={
          sheetTicket && !sheetTicket.isNew
            ? () => {
                deleteTickets([sheetTicket.ticket.id]);
                setSheetOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
