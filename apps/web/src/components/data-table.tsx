'use client';

import { flexRender, type ColumnDef, type SortDirection, type Table } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from 'lucide-react';
import { Reorder } from 'motion/react';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ─── Column helpers ──────────────────────────────────────────────────────────

/** The checkbox column: tick rows for the selection bar. `noun` is for screen readers. */
export function selectColumn<TData>(noun: string): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label={`Select all ${noun}s`}
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${noun}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

/** A round badge with someone's initials. */
export function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <span className="bg-vivid-cyan/10 text-vivid-cyan flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
      {initials || '?'}
    </span>
  );
}

/** A bold first line with a muted second line underneath. */
export function TwoLineCell({ primary, secondary }: { primary: React.ReactNode; secondary: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-foreground truncate font-medium">{primary}</p>
      <p className="text-muted-foreground truncate text-xs">{secondary}</p>
    </div>
  );
}

function SortIcon({ direction }: { direction: false | SortDirection }) {
  if (direction === 'asc') return <ChevronUpIcon className="text-foreground size-3.5" />;
  if (direction === 'desc') return <ChevronDownIcon className="text-foreground size-3.5" />;
  return <ChevronsUpDownIcon className="size-3.5 opacity-60" />;
}

// ─── Table ───────────────────────────────────────────────────────────────────

interface DataTableProps<TData> {
  table: Table<TData>;
  /**
   * Lets rows be grabbed anywhere and dragged into a new order, with the other
   * rows sliding out of the way. Leave it out for tables that keep their own
   * order. Called with the new order of the rows on screen.
   */
  onReorder?: (ids: string[]) => void;
  /** Clicking (or Enter on) a row. */
  onRowClick?: (row: TData) => void;
  emptyText: string;
}

/**
 * The table inside a workspace card: sortable headers, clean rows and an empty
 * state. Columns with `meta.cell.variant: 'number'` are right-aligned.
 */
export function DataTable<TData>({ table, onReorder, onRowClick, emptyText }: DataTableProps<TData>) {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  // Letting go of a drag also fires a click on the row; this swallows it.
  const justDraggedRef = React.useRef(false);

  const rows = table.getRowModel().rows;
  // A sort decides the on-screen order, so dragging is off while one is active.
  const canReorder = Boolean(onReorder) && table.getState().sorting.length === 0;

  return (
    // overflow-y-hidden: a row dragged past the ends is clipped instead of
    // growing a vertical scrollbar mid-drag.
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
          onReorder={(ids: string[]) => onReorder?.(ids)}
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
                if (onRowClick && !justDraggedRef.current) onRowClick(row.original);
              }}
              onKeyDown={(event: React.KeyboardEvent) => {
                if (onRowClick && event.key === 'Enter' && event.target === event.currentTarget) {
                  onRowClick(row.original);
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              aria-selected={row.getIsSelected()}
              className={cn(
                'relative transition-colors outline-none focus-visible:bg-muted [&>td]:border-b',
                row.getIsSelected() ? 'bg-vivid-cyan/6' : 'bg-card',
                'hover:bg-muted',
                canReorder ? 'cursor-grab active:cursor-grabbing' : onRowClick && 'cursor-pointer',
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
                    // The checkbox toggles selection only — it doesn't open the row.
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
              <td
                colSpan={table.getVisibleLeafColumns().length}
                className="text-muted-foreground h-32 text-center text-sm"
              >
                {emptyText}
              </td>
            </tr>
          ) : null}
        </Reorder.Group>
      </table>
    </div>
  );
}
