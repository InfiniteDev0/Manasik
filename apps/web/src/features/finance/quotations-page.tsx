'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { gooeyToast } from 'goey-toast';
import { ArrowRightIcon, FileTextIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DataTable, selectColumn } from '@/components/data-table';
import { DatePicker, matchesDateRange, useMonthDateFilter } from '@/components/date-picker';
import {
  InversePanel,
  SectionHeader,
  SelectionBar,
  SlideDown,
  TableSearch,
  TableTabs,
} from '@/components/table-parts';
import { Button } from '@/components/ui/button';
import { WORKSPACE_PATH } from '@/features/workspace/navigation';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatAmount, formatDayLabel } from '@/lib/format';

import { describeService, matchesWords, serviceLabel, type Quotation } from './finance-data';
import { ClientCell, DocNumber, ServiceCell, StatusPill } from './finance-parts';
import { useFinance } from './finance-store';
import { QuotationForm } from './quotation-form';

const QUOTATIONS_PATH = `${WORKSPACE_PATH}/finance/quotations`;
const INVOICES_PATH = `${WORKSPACE_PATH}/finance/invoices`;

const TABS = [
  { id: 'all', label: 'All quotations', matches: () => true },
  { id: 'open', label: 'Open', matches: (quotation: Quotation) => !quotation.invoiceId },
  { id: 'invoiced', label: 'Invoiced', matches: (quotation: Quotation) => Boolean(quotation.invoiceId) },
];

/** "Create invoice" while the quotation is open; a way to its invoice once it's been invoiced. */
function QuotationAction({ quotation }: { quotation: Quotation }) {
  const { invoiceQuotation } = useFinance();
  const router = useRouter();

  return (
    // Clicking a row opens the quotation; this button does its own thing instead.
    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {quotation.invoiceId ? (
        <Button variant="ghost" size="sm" onClick={() => router.push(`${INVOICES_PATH}/${quotation.invoiceId}`)}>
          View invoice
          <ArrowRightIcon />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const invoice = invoiceQuotation(quotation.id);
            if (!invoice) return;
            gooeyToast.success(`Invoice ${invoice.number} created`, {
              description: `From ${quotation.number} for ${quotation.client}.`,
              action: { label: 'View', onClick: () => router.push(`${INVOICES_PATH}/${invoice.id}`) },
            });
          }}
        >
          <FileTextIcon />
          Create invoice
        </Button>
      )}
    </div>
  );
}

const COLUMNS: ColumnDef<Quotation>[] = [
  selectColumn<Quotation>('quotation'),
  {
    id: 'number',
    accessorKey: 'number',
    header: 'Quotation',
    meta: { label: 'Quotation' },
    cell: ({ row }) => <DocNumber>{row.original.number}</DocNumber>,
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
    accessorFn: (quotation) => `${serviceLabel(quotation.service)} — ${describeService(quotation.service, quotation.details)}`,
    header: 'Service',
    meta: { label: 'Service' },
    sortingFn: (a, b) => serviceLabel(a.original.service).localeCompare(serviceLabel(b.original.service)),
    cell: ({ row }) => (
      <ServiceCell
        service={row.original.service}
        description={describeService(row.original.service, row.original.details)}
      />
    ),
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: 'Amount',
    meta: { label: 'Amount', cell: { variant: 'number' } },
    cell: ({ row }) => <span className="text-foreground font-medium tabular-nums">{formatAmount(row.original.amount)}</span>,
  },
  {
    id: 'status',
    accessorFn: (quotation) => (quotation.invoiceId ? 'Invoiced' : 'Open'),
    header: 'Status',
    meta: { label: 'Status' },
    cell: ({ row }) =>
      row.original.invoiceId ? <StatusPill tone="green">Invoiced</StatusPill> : <StatusPill tone="amber">Open</StatusPill>,
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
    cell: ({ row }) => <QuotationAction quotation={row.original} />,
  },
];

/**
 * Quotations: what customers have asked for and the price offered. When a
 * customer goes ahead, Create invoice turns the quotation into an invoice.
 */
export function QuotationsPage() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const { quotations, addQuotation } = useFinance();
  const router = useRouter();
  const [tabId, setTabId] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = useMonthDateFilter();
  const [adding, setAdding] = React.useState(false);

  const tab = TABS.find(({ id }) => id === tabId) ?? TABS[0];
  const tableData = React.useMemo(
    () => quotations.filter((quotation) => (!tab || tab.matches(quotation)) && matchesDateRange(quotation.date, dateFilter)),
    [quotations, tab, dateFilter],
  );
  const counts = React.useMemo(
    () => Object.fromEntries(TABS.map(({ id, matches }) => [id, quotations.filter(matches).length])),
    [quotations],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole quotation, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => {
      const quotation = row.original;
      return matchesWords(
        [
          quotation.number,
          quotation.client,
          quotation.phone,
          serviceLabel(quotation.service),
          describeService(quotation.service, quotation.details),
          quotation.amount,
          quotation.date,
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
        title="Quotations"
        description="Price what a customer asks for — click one to see or print it. When they go ahead, turn it into an invoice."
        onExport={() => exportTableToCsv(table, `quotations-${formatDateToString(new Date())}.csv`)}
        addLabel="New quotation"
        onAdd={() => setAdding((open) => !open)}
        adding={adding}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs tabs={TABS} value={tabId} onValueChange={setTabId} counts={counts} label="Quotation status" />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search quotations"
            label="Search quotations"
          />
          <DatePicker value={dateFilter} onChange={setDateFilter} align="end" className="bg-card h-9 shadow-xs" />
        </div>

        <SlideDown open={adding}>
          <InversePanel>
            <QuotationForm
              onCancel={() => setAdding(false)}
              onCreate={(input) => {
                const quotation = addQuotation(input);
                setSearchQuery('');
                setAdding(false);
                gooeyToast.success(`Quotation ${quotation.number} saved`);
              }}
            />
          </InversePanel>
        </SlideDown>

        <SlideDown open={selectedRows.length > 0}>
          <SelectionBar
            count={selectedRows.length}
            onExport={() =>
              exportTableToCsv(table, `quotations-selected-${formatDateToString(new Date())}.csv`, selectedRows)
            }
            onClear={() => table.resetRowSelection()}
          />
        </SlideDown>

        <DataTable
          table={table}
          onRowClick={(quotation) => router.push(`${QUOTATIONS_PATH}/${quotation.id}`)}
          emptyText={quotations.length === 0 ? 'No quotations yet.' : 'No quotations match.'}
        />
      </div>
    </div>
  );
}
