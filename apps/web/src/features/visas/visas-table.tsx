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

import { DatePicker, EMPTY_DATE_PICKER_VALUE, getMonthValue, type DatePickerValue } from '@/components/date-picker';
import { SectionHeader, SelectionBar, TableSearch, TableTabs } from '@/components/table-parts';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatAmount, formatDayLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

import { VisaStatusBadge } from './visa-fields';
import { VisaForm } from './visa-form';
import { VisaSheet } from './visa-sheet';
import {
  SAMPLE_VISAS,
  VISA_CATEGORIES,
  visaMatchesDate,
  visaMatchesSearch,
  type VisaRow,
} from './visas-data';

// ─── Columns ─────────────────────────────────────────────────────────────────

function NameCell({ visa }: { visa: VisaRow }) {
  const initials = visa.name
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
      <span className="text-foreground truncate font-medium">{visa.name || 'Unnamed'}</span>
    </div>
  );
}

function moneyColumn(id: 'net' | 'paid' | 'commission', label: string): ColumnDef<VisaRow> {
  return {
    id,
    accessorKey: id,
    header: label,
    meta: { label, cell: { variant: 'number', min: 0, step: 0.01 } },
    cell: ({ row }) => (
      <span className={cn('tabular-nums', id === 'net' ? 'text-foreground font-medium' : 'text-muted-foreground')}>
        {formatAmount(row.original[id])}
      </span>
    ),
  };
}

const COLUMNS: ColumnDef<VisaRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all visas"
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select visa"
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    meta: { label: 'Name', cell: { variant: 'short-text' } },
    cell: ({ row }) => <NameCell visa={row.original} />,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Visa status',
    meta: { label: 'Visa status', cell: { variant: 'short-text' } },
    cell: ({ row }) => <VisaStatusBadge status={row.original.status} />,
  },
  {
    id: 'city',
    accessorKey: 'city',
    header: 'City',
    meta: { label: 'City', cell: { variant: 'short-text' } },
    cell: ({ row }) => <span className="text-foreground">{row.original.city || '—'}</span>,
  },
  moneyColumn('net', 'Net amount'),
  moneyColumn('paid', 'Paid amount'),
  moneyColumn('commission', 'Commission'),
  // The day the visa was created — filled in on its own, so it sits at the end.
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
 * The Visas table: status tabs, search and a date filter, sortable headers, and
 * rows you can grab anywhere and drag into a new order. Clicking a row opens it
 * for editing. Rows live in local state for now.
 */
export function VisasTable() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const [data, setData] = React.useState<VisaRow[]>(SAMPLE_VISAS);
  const [categoryId, setCategoryId] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  // null until a date is picked — until then the filter is the current month.
  const [pickedDate, setPickedDate] = React.useState<DatePickerValue | null>(null);
  const currentMonth = React.useSyncExternalStore(subscribeNever, getCurrentMonth, getNoMonth);
  const thisMonth = React.useMemo(
    () => (currentMonth ? getMonthValue(parse(currentMonth, 'yyyy-MM', new Date())) : EMPTY_DATE_PICKER_VALUE),
    [currentMonth],
  );
  const dateFilter = pickedDate ?? thisMonth;

  // The sheet keeps its last visa while it animates closed.
  const [sheetVisa, setSheetVisa] = React.useState<VisaRow | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // Letting go of a drag also fires a click on the row; this swallows it.
  const justDraggedRef = React.useRef(false);

  const category = VISA_CATEGORIES.find(({ id }) => id === categoryId) ?? VISA_CATEGORIES[0];

  // The tab and the date picker narrow the visas before the table sees them;
  // the search then runs inside the table.
  const tableData = React.useMemo(
    () => data.filter((visa) => (!category || category.matches(visa)) && visaMatchesDate(visa, dateFilter)),
    [data, category, dateFilter],
  );

  const counts = React.useMemo(
    () => Object.fromEntries(VISA_CATEGORIES.map(({ id, matches }) => [id, data.filter(matches).length])),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole visa, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => visaMatchesSearch(row.original, query),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedRows = rows.filter((row) => row.getIsSelected());
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  // A sort decides the on-screen order, so dragging is off while one is active.
  const canReorder = table.getState().sorting.length === 0;

  const openSheet = (visa: VisaRow) => {
    setSheetVisa(visa);
    setSheetOpen(true);
  };

  // `nextIds` is the new order of the rows on screen. Their slots in the full
  // list are refilled in that order, so visas hidden by a tab, the search or the
  // date filter keep their places.
  const onReorder = (nextIds: string[]) => {
    setData((previous) => {
      const byId = new Map(previous.map((visa) => [visa.id, visa]));
      const moving = new Set(nextIds);
      let slot = 0;
      return previous.map((visa) => {
        if (!moving.has(visa.id)) return visa;
        const id = nextIds[slot++];
        return (id && byId.get(id)) || visa;
      });
    });
  };

  // Deletes with an Undo that puts the visas back where they were.
  const deleteVisas = (ids: string[]) => {
    const idSet = new Set(ids);
    const removed = data.flatMap((visa, index) => (idSet.has(visa.id) ? [{ visa, index }] : []));
    if (removed.length === 0) return;

    setData((previous) => previous.filter((visa) => !idSet.has(visa.id)));
    table.setRowSelection((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([id]) => !idSet.has(id))),
    );

    gooeyToast.success(`${removed.length} ${removed.length === 1 ? 'visa' : 'visas'} deleted`, {
      action: {
        label: 'Undo',
        successLabel: 'Restored',
        onClick: () =>
          setData((previous) => {
            const next = [...previous];
            // Ascending original positions, so each insert lands where it was.
            for (const { visa, index } of removed) {
              if (!next.some((existing) => existing.id === visa.id)) {
                next.splice(Math.min(index, next.length), 0, visa);
              }
            }
            return next;
          }),
      },
    });
  };

  const createVisa = (visa: VisaRow) => {
    // Newest first. The search is cleared so the new visa isn't hidden by it.
    setData((previous) => [visa, ...previous]);
    setSearchQuery('');
    setAdding(false);
    gooeyToast.success('Visa created');
  };

  const saveVisa = (visa: VisaRow) => {
    setData((previous) => previous.map((existing) => (existing.id === visa.id ? visa : existing)));
    setSheetOpen(false);
  };

  const onlySelected = selectedRows.length === 1 ? selectedRows[0] : undefined;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Visas"
        description="Track the visas you handle for clients — where they're going, and what was paid."
        addLabel="Add visa"
        onExport={() => exportTableToCsv(table, `visas-${formatDateToString(new Date())}.csv`)}
        onAdd={() => setAdding((open) => !open)}
        adding={adding}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs
          tabs={VISA_CATEGORIES}
          value={categoryId}
          onValueChange={setCategoryId}
          counts={counts}
          label="Visa categories"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search visas"
            label="Search visas"
          />
          <DatePicker
            value={dateFilter}
            onChange={setPickedDate}
            align="end"
            className="bg-card h-9 shadow-xs"
          />
        </div>

        {/* Add visa opens this space above the table and pushes the table down. */}
        <AnimatePresence initial={false}>
          {adding ? (
            <motion.div
              key="add-visa"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <VisaForm onCreate={createVisa} onCancel={() => setAdding(false)} />
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
                onEdit={onlySelected ? () => openSheet(onlySelected.original) : undefined}
                onExport={() =>
                  exportTableToCsv(table, `visas-selected-${formatDateToString(new Date())}.csv`, selectedRows)
                }
                onDelete={() => deleteVisas(selectedRows.map((row) => row.original.id))}
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
                    if (!justDraggedRef.current) openSheet(row.original);
                  }}
                  onKeyDown={(event: React.KeyboardEvent) => {
                    if (event.key === 'Enter' && event.target === event.currentTarget) {
                      openSheet(row.original);
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
                        // The checkbox toggles selection only — it doesn't open the visa.
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
                    {data.length === 0 ? 'No visas yet.' : 'No visas match.'}
                  </td>
                </tr>
              ) : null}
            </Reorder.Group>
          </table>
        </div>
      </div>

      <VisaSheet
        open={sheetOpen}
        visa={sheetVisa}
        onClose={() => setSheetOpen(false)}
        onSave={saveVisa}
        onDelete={
          sheetVisa
            ? () => {
                deleteVisas([sheetVisa.id]);
                setSheetOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
