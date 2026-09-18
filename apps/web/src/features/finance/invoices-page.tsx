'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { gooeyToast } from 'goey-toast';
import { BadgeCheckIcon, PrinterIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DataTable, selectColumn } from '@/components/data-table';
import { DatePicker, matchesDateRange, useMonthDateFilter } from '@/components/date-picker';
import { SectionHeader, SelectionBar, SlideDown, TableSearch, TableTabs } from '@/components/table-parts';
import { Button } from '@/components/ui/button';
import { WORKSPACE_PATH } from '@/features/workspace/navigation';
import { formatMoney } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatDayLabel } from '@/lib/format';

import { matchesWords, paymentMethodLabel, serviceLabel, type Invoice, type Receipt } from './finance-data';
import { ClientCell, DocNumber, ServiceCell, StatusPill } from './finance-parts';
import { useFinance } from './finance-store';
import { PaymentDialog } from './payment-dialog';
import { ReceiptDialog } from './receipt-dialog';

const INVOICES_PATH = `${WORKSPACE_PATH}/finance/invoices`;
const RECEIPTS_PATH = `${WORKSPACE_PATH}/finance/receipts`;

const TABS = [
  { id: 'all', label: 'All invoices', matches: () => true },
  { id: 'unpaid', label: 'Unpaid', matches: (invoice: Invoice) => !invoice.paidOn },
  { id: 'paid', label: 'Paid', matches: (invoice: Invoice) => Boolean(invoice.paidOn) },
];

/**
 * The invoice's next step: Confirm payment while it's unpaid, then Print
 * receipt — which files the receipt on the Receipts page. Reprint after that.
 */
function InvoiceAction({ invoice }: { invoice: Invoice }) {
  const { confirmPayment, issueReceipt } = useFinance();
  const router = useRouter();
  const [paying, setPaying] = React.useState(false);
  const [receipt, setReceipt] = React.useState<Receipt | null>(null);

  const printReceipt = () => {
    const printed = issueReceipt(invoice.id);
    if (!printed) return;
    setReceipt(printed);
    if (!invoice.receiptId) {
      gooeyToast.success(`Receipt ${printed.number} created`, {
        action: { label: 'View receipts', onClick: () => router.push(RECEIPTS_PATH) },
      });
    }
  };

  return (
    // Clicking a row opens the invoice. These buttons — and the dialogs they
    // open, whose clicks bubble up through React — do their own thing instead.
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {!invoice.paidOn ? (
        <Button variant="outline" size="sm" onClick={() => setPaying(true)}>
          <BadgeCheckIcon />
          Confirm payment
        </Button>
      ) : invoice.receiptId ? (
        <Button variant="ghost" size="sm" onClick={printReceipt}>
          <PrinterIcon />
          Reprint receipt
        </Button>
      ) : (
        <Button size="sm" onClick={printReceipt}>
          <PrinterIcon />
          Print receipt
        </Button>
      )}

      <PaymentDialog
        open={paying}
        invoice={invoice}
        onOpenChange={setPaying}
        onConfirm={(method) => {
          confirmPayment(invoice.id, method);
          setPaying(false);
          gooeyToast.success(`${invoice.number} paid`, { description: 'You can print the receipt now.' });
        }}
      />
      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} printOnOpen />
    </div>
  );
}

const COLUMNS: ColumnDef<Invoice>[] = [
  selectColumn<Invoice>('invoice'),
  {
    id: 'number',
    accessorKey: 'number',
    header: 'Invoice',
    meta: { label: 'Invoice' },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <DocNumber>{row.original.number}</DocNumber>
        <span className="text-muted-foreground font-mono text-xs">{row.original.quotationNumber}</span>
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
    accessorFn: (invoice) => `${serviceLabel(invoice.service)} — ${invoice.description}`,
    header: 'Service',
    meta: { label: 'Service' },
    sortingFn: (a, b) => serviceLabel(a.original.service).localeCompare(serviceLabel(b.original.service)),
    cell: ({ row }) => <ServiceCell service={row.original.service} description={row.original.description} />,
  },
  // For the CSV export only — the amount already shows its currency.
  {
    id: 'currency',
    accessorKey: 'currency',
    header: 'Currency',
    meta: { label: 'Currency' },
    enableSorting: false,
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: 'Amount',
    meta: { label: 'Amount', cell: { variant: 'number' } },
    cell: ({ row }) => <span className="text-foreground font-medium tabular-nums">{formatMoney(row.original.amount, row.original.currency)}</span>,
  },
  {
    id: 'status',
    accessorFn: (invoice) => (invoice.paidOn ? `Paid (${paymentMethodLabel(invoice.method)})` : 'Unpaid'),
    header: 'Status',
    meta: { label: 'Status' },
    cell: ({ row }) =>
      row.original.paidOn ? (
        <div className="flex items-center gap-2">
          <StatusPill tone="green">Paid</StatusPill>
          <span className="text-muted-foreground text-xs">{paymentMethodLabel(row.original.method)}</span>
        </div>
      ) : (
        <StatusPill tone="amber">Unpaid</StatusPill>
      ),
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: 'Date created',
    meta: { label: 'Date created' },
    cell: ({ row }) => <span className="text-muted-foreground">{formatDayLabel(row.original.date)}</span>,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    enableSorting: false,
    cell: ({ row }) => <InvoiceAction invoice={row.original} />,
  },
];

/**
 * Invoices: quotations the customer went ahead with. Confirm the payment, then
 * print the receipt.
 */
export function InvoicesPage() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const { invoices } = useFinance();
  const router = useRouter();
  const [tabId, setTabId] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = useMonthDateFilter();

  const tab = TABS.find(({ id }) => id === tabId) ?? TABS[0];
  const tableData = React.useMemo(
    () => invoices.filter((invoice) => (!tab || tab.matches(invoice)) && matchesDateRange(invoice.date, dateFilter)),
    [invoices, tab, dateFilter],
  );
  const counts = React.useMemo(
    () => Object.fromEntries(TABS.map(({ id, matches }) => [id, invoices.filter(matches).length])),
    [invoices],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole invoice, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => {
      const invoice = row.original;
      return matchesWords(
        [
          invoice.number,
          invoice.quotationNumber,
          invoice.client,
          invoice.phone,
          serviceLabel(invoice.service),
          invoice.description,
          invoice.amount,
          invoice.paidOn ? 'paid' : 'unpaid',
          invoice.date,
        ],
        query,
      );
    },
    initialState: { columnVisibility: { currency: false } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getRowModel().rows.filter((row) => row.getIsSelected());

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Invoices"
        description="Quotations your customers went ahead with. Click one to see or print it; confirm the payment, then print the receipt."
        onExport={() => exportTableToCsv(table, `invoices-${formatDateToString(new Date())}.csv`)}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs tabs={TABS} value={tabId} onValueChange={setTabId} counts={counts} label="Invoice status" />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search invoices"
            label="Search invoices"
          />
          <DatePicker value={dateFilter} onChange={setDateFilter} align="end" className="bg-card h-9 shadow-xs" />
        </div>

        <SlideDown open={selectedRows.length > 0}>
          <SelectionBar
            count={selectedRows.length}
            onExport={() =>
              exportTableToCsv(table, `invoices-selected-${formatDateToString(new Date())}.csv`, selectedRows)
            }
            onClear={() => table.resetRowSelection()}
          />
        </SlideDown>

        <DataTable
          table={table}
          onRowClick={(invoice) => router.push(`${INVOICES_PATH}/${invoice.id}`)}
          emptyText={
            invoices.length === 0 ? 'No invoices yet — create one from a quotation.' : 'No invoices match.'
          }
        />
      </div>
    </div>
  );
}
