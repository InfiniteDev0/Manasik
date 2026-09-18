'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PrinterIcon } from 'lucide-react';
import * as React from 'react';

import { DataTable, selectColumn } from '@/components/data-table';
import { DatePicker, matchesDateRange, useMonthDateFilter } from '@/components/date-picker';
import { SectionHeader, SelectionBar, SlideDown, TableSearch, TableTabs } from '@/components/table-parts';
import { Button } from '@/components/ui/button';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatAmount, formatDayLabel } from '@/lib/format';

import { matchesWords, paymentMethodLabel, serviceLabel, type Receipt } from './finance-data';
import { ClientCell, DocNumber, ServiceCell } from './finance-parts';
import { useFinance } from './finance-store';
import { ReceiptDialog } from './receipt-dialog';

const TABS = [{ id: 'all', label: 'All receipts', matches: () => true }];

/** Prints the receipt straight away (clicking the row instead just shows it). */
function PrintReceiptButton({ receipt }: { receipt: Receipt }) {
  const [printing, setPrinting] = React.useState<Receipt | null>(null);

  return (
    // Keeps the click — and the dialog's clicks, which bubble up through React —
    // from also opening the row's own receipt view.
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <Button variant="outline" size="sm" onClick={() => setPrinting(receipt)}>
        <PrinterIcon />
        Print
      </Button>
      <ReceiptDialog receipt={printing} onClose={() => setPrinting(null)} printOnOpen />
    </div>
  );
}

const COLUMNS: ColumnDef<Receipt>[] = [
  selectColumn<Receipt>('receipt'),
  {
    id: 'number',
    accessorKey: 'number',
    header: 'Receipt',
    meta: { label: 'Receipt' },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <DocNumber>{row.original.number}</DocNumber>
        <span className="text-muted-foreground font-mono text-xs">{row.original.invoiceNumber}</span>
      </div>
    ),
  },
  {
    id: 'client',
    accessorKey: 'client',
    header: 'Client',
    meta: { label: 'Client' },
    cell: ({ row }) => <ClientCell client={row.original.client} phone={row.original.phone} />,
  },
  {
    id: 'service',
    accessorFn: (receipt) => `${serviceLabel(receipt.service)} — ${receipt.description}`,
    header: 'Service',
    meta: { label: 'Service' },
    sortingFn: (a, b) => serviceLabel(a.original.service).localeCompare(serviceLabel(b.original.service)),
    cell: ({ row }) => <ServiceCell service={row.original.service} description={row.original.description} />,
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: 'Amount paid',
    meta: { label: 'Amount paid', cell: { variant: 'number' } },
    cell: ({ row }) => <span className="text-foreground font-medium tabular-nums">{formatAmount(row.original.amount)}</span>,
  },
  {
    id: 'method',
    accessorFn: (receipt) => paymentMethodLabel(receipt.method),
    header: 'Paid by',
    meta: { label: 'Paid by' },
    cell: ({ row }) => <span className="text-foreground">{paymentMethodLabel(row.original.method)}</span>,
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: 'Date printed',
    meta: { label: 'Date printed' },
    cell: ({ row }) => <span className="text-muted-foreground">{formatDayLabel(row.original.date)}</span>,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => <PrintReceiptButton receipt={row.original} />,
  },
];

/** Receipts: every receipt printed from a paid invoice. Click one to see it or print it again. */
export function ReceiptsPage() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const { receipts } = useFinance();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = useMonthDateFilter();
  const [openReceipt, setOpenReceipt] = React.useState<Receipt | null>(null);

  const tableData = React.useMemo(
    () => receipts.filter((receipt) => matchesDateRange(receipt.date, dateFilter)),
    [receipts, dateFilter],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole receipt, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => {
      const receipt = row.original;
      return matchesWords(
        [
          receipt.number,
          receipt.invoiceNumber,
          receipt.quotationNumber,
          receipt.client,
          receipt.phone,
          serviceLabel(receipt.service),
          receipt.description,
          receipt.amount,
          paymentMethodLabel(receipt.method),
          receipt.date,
        ],
        query,
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getRowModel().rows.filter((row) => row.getIsSelected());

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Receipts"
        description="Every receipt printed for a paid invoice. Click one to see it or print it again."
        onExport={() => exportTableToCsv(table, `receipts-${formatDateToString(new Date())}.csv`)}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs
          tabs={TABS}
          value="all"
          onValueChange={() => {}}
          counts={{ all: receipts.length }}
          label="Receipts"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search receipts"
            label="Search receipts"
          />
          <DatePicker value={dateFilter} onChange={setDateFilter} align="end" className="bg-card h-9 shadow-xs" />
        </div>

        <SlideDown open={selectedRows.length > 0}>
          <SelectionBar
            count={selectedRows.length}
            onExport={() =>
              exportTableToCsv(table, `receipts-selected-${formatDateToString(new Date())}.csv`, selectedRows)
            }
            onClear={() => table.resetRowSelection()}
          />
        </SlideDown>

        <DataTable
          table={table}
          onRowClick={setOpenReceipt}
          emptyText={
            receipts.length === 0 ? 'No receipts yet — print one from a paid invoice.' : 'No receipts match.'
          }
        />
      </div>

      <ReceiptDialog receipt={openReceipt} onClose={() => setOpenReceipt(null)} />
    </div>
  );
}
