'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  Settings2Icon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/strings';
import { cn } from '@/lib/utils';

export interface DataTableFilter {
  /** Column id this filter drives. */
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Placeholder for the search box. Omit to hide search entirely. */
  searchPlaceholder?: string;
  /** Dropdown filters shown next to the search box. */
  filters?: DataTableFilter[];
  /** Makes rows clickable — used to open the detail page. */
  onRowClick?: (row: TData) => void;
  /** Shown in place of the table body when there is nothing to display. */
  emptyState?: React.ReactNode;
  pageSize?: number;
  /** Extra controls rendered at the right of the toolbar. */
  toolbarActions?: React.ReactNode;
  className?: string;
}

const PAGE_SIZES = [10, 20, 30, 50, 100];

/**
 * The list table used by every workspace page.
 *
 * <p>Built directly on TanStack Table v8 plus the plain shadcn table rather
 * than a pre-built grid: the packaged grids in this space assume Radix, and
 * this project is on Base UI. Adapting one cost more than owning this file.
 *
 * <p>Columns are declared by each page. Everything generic — search, sorting,
 * faceted filters, column visibility, pagination — lives here so eight pages
 * do not each reinvent it.
 */
export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder,
  filters = [],
  onRowClick,
  emptyState,
  pageSize = 20,
  toolbarActions,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // The default `auto` filter compares against the rendered cell, which
    // misses anything a cell renders as a badge or a formatted amount.
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const hasActiveFilters = columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {searchPlaceholder ? (
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8"
            />
          </div>
        ) : null}

        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null;

          const value = (column.getFilterValue() as string | undefined) ?? '__all__';

          return (
            <Select
              key={filter.columnId}
              value={value}
              onValueChange={(next: unknown) =>
                column.setFilterValue(next === '__all__' ? undefined : String(next))
              }
            >
              <SelectTrigger size="sm" className="h-8 w-full sm:w-auto sm:min-w-36">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setColumnFilters([]);
              setGlobalFilter('');
            }}
          >
            {t('common.clearFilters')}
          </Button>
        ) : null}

        <div className="flex items-center gap-2 sm:ml-auto">
          {toolbarActions}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8">
                  <Settings2Icon className="size-4" />
                  <span className="hidden sm:inline">{t('common.columns')}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{t('common.columns')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked: boolean) => column.toggleVisibility(checked)}
                  >
                    {columnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 && emptyState && !hasActiveFilters ? (
        emptyState
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();

                      return (
                        <TableHead key={header.id} className="h-9 whitespace-nowrap">
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === 'asc' ? (
                                <ArrowUpIcon className="size-3.5" />
                              ) : sorted === 'desc' ? (
                                <ArrowDownIcon className="size-3.5" />
                              ) : (
                                <ChevronsUpDownIcon className="size-3.5 opacity-40" />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={table.getVisibleFlatColumns().length}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      {t('common.none')}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(onRowClick && 'cursor-pointer')}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalRows > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t('common.showing', {
              from: pageIndex * currentPageSize + 1,
              to: Math.min((pageIndex + 1) * currentPageSize, totalRows),
              total: totalRows,
            })}
          </p>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t('common.rowsPerPage')}
            </span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(next: unknown) => table.setPageSize(Number(next))}
            >
              <SelectTrigger size="sm" className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label={t('common.previous')}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label={t('common.next')}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Turns a column id like `departureDate` into "Departure date" for the toggle menu. */
function columnLabel(id: string): string {
  const spaced = id.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
