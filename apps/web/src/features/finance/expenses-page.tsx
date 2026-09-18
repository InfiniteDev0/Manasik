'use client';

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { gooeyToast } from 'goey-toast';
import * as React from 'react';

import { DataTable, selectColumn, TwoLineCell } from '@/components/data-table';
import { DatePicker, matchesDateRange, useMonthDateFilter } from '@/components/date-picker';
import {
  InversePanel,
  SectionHeader,
  SelectionBar,
  SlideDown,
  TableSearch,
  TableTabs,
} from '@/components/table-parts';
import { formatMoney, formatTotals } from '@/lib/currency';
import { formatDateToString } from '@/lib/data-grid';
import { exportTableToCsv } from '@/lib/export-csv';
import { formatDayLabel } from '@/lib/format';

import { ExpenseForm } from './expense-form';
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type Expense } from './expenses-data';
import { matchesWords, paymentMethodLabel } from './finance-data';
import { StatusPill } from './finance-parts';
import { useFinance } from './finance-store';

/** All expenses, then one tab per category. */
const TABS = [
  { id: 'all', label: 'All expenses', matches: () => true },
  ...EXPENSE_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    matches: (expense: Expense) => expense.category === category.id,
  })),
];

const COLUMNS: ColumnDef<Expense>[] = [
  selectColumn<Expense>('expense'),
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Expense',
    meta: { label: 'Expense' },
    cell: ({ row }) => (
      <TwoLineCell primary={row.original.description} secondary={row.original.payee || 'No payee'} />
    ),
  },
  {
    id: 'payee',
    accessorKey: 'payee',
    header: 'Paid to',
    meta: { label: 'Paid to' },
  },
  {
    id: 'category',
    accessorFn: (expense) => expenseCategoryLabel(expense.category),
    header: 'Category',
    meta: { label: 'Category' },
    cell: ({ row }) => <StatusPill tone="muted">{expenseCategoryLabel(row.original.category)}</StatusPill>,
  },
  {
    id: 'method',
    accessorFn: (expense) => paymentMethodLabel(expense.method),
    header: 'Paid by',
    meta: { label: 'Paid by' },
    cell: ({ row }) => (
      <TwoLineCell
        primary={paymentMethodLabel(row.original.method)}
        secondary={row.original.reference ? <span className="font-mono">{row.original.reference}</span> : 'No reference'}
      />
    ),
  },
  {
    id: 'reference',
    accessorKey: 'reference',
    header: 'Reference',
    meta: { label: 'Reference' },
  },
  {
    id: 'currency',
    accessorKey: 'currency',
    header: 'Currency',
    meta: { label: 'Currency' },
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: 'Amount',
    meta: { label: 'Amount', cell: { variant: 'number' } },
    cell: ({ row }) => <span className="text-foreground font-medium tabular-nums">{formatMoney(row.original.amount, row.original.currency)}</span>,
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: 'Date paid',
    meta: { label: 'Date paid' },
    cell: ({ row }) => <span className="text-muted-foreground">{formatDayLabel(row.original.date)}</span>,
  },
];

// Payee and reference show as the second line of other columns, and the amount
// shows its currency, so these columns stay hidden — but they're in the CSV export.
const HIDDEN_COLUMNS = { payee: false, reference: false, currency: false };

/**
 * Expenses: what the agency spends to run — rent, salaries, marketing,
 * transport. The total under the table adds up whatever is on screen.
 */
export function ExpensesPage() {
  // TanStack keeps its state inside a stable `table` object, which the React
  // Compiler can't see change — so this component opts out of memoization.
  'use no memo';

  const { expenses, addExpense, removeExpenses, restoreExpenses } = useFinance();
  const [tabId, setTabId] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = useMonthDateFilter();
  const [adding, setAdding] = React.useState(false);

  const tab = TABS.find(({ id }) => id === tabId) ?? TABS[0];
  const tableData = React.useMemo(
    () => expenses.filter((expense) => (!tab || tab.matches(expense)) && matchesDateRange(expense.date, dateFilter)),
    [expenses, tab, dateFilter],
  );
  const counts = React.useMemo(
    () => Object.fromEntries(TABS.map(({ id, matches }) => [id, expenses.filter(matches).length])),
    [expenses],
  );

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: { globalFilter: searchQuery },
    onGlobalFilterChange: setSearchQuery,
    // The search looks at the whole expense, not one column at a time.
    globalFilterFn: (row, _columnId, query: string) => {
      const expense = row.original;
      return matchesWords(
        [
          expense.description,
          expense.payee,
          expenseCategoryLabel(expense.category),
          paymentMethodLabel(expense.method),
          expense.reference,
          expense.amount,
          expense.date,
        ],
        query,
      );
    },
    initialState: { columnVisibility: HIDDEN_COLUMNS },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const selectedRows = rows.filter((row) => row.getIsSelected());
  // Per currency — USD and KSh never mix.
  const total = formatTotals(rows.map((row) => row.original));

  const deleteExpenses = (ids: string[]) => {
    const removed = removeExpenses(ids);
    if (removed.length === 0) return;
    const idSet = new Set(ids);
    table.setRowSelection((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([id]) => !idSet.has(id))),
    );
    gooeyToast.success(`${removed.length} ${removed.length === 1 ? 'expense' : 'expenses'} deleted`, {
      action: { label: 'Undo', successLabel: 'Restored', onClick: () => restoreExpenses(removed) },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Expenses"
        description="What the agency spends to run — rent, salaries, marketing, transport."
        onExport={() => exportTableToCsv(table, `expenses-${formatDateToString(new Date())}.csv`)}
        addLabel="Add expense"
        onAdd={() => setAdding((open) => !open)}
        adding={adding}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <TableTabs tabs={TABS} value={tabId} onValueChange={setTabId} counts={counts} label="Expense categories" />

        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search expenses"
            label="Search expenses"
          />
          <DatePicker value={dateFilter} onChange={setDateFilter} align="end" className="bg-card h-9 shadow-xs" />
        </div>

        <SlideDown open={adding}>
          <InversePanel>
            <ExpenseForm
              onCancel={() => setAdding(false)}
              onCreate={(expense) => {
                addExpense(expense);
                setSearchQuery('');
                setAdding(false);
                gooeyToast.success('Expense saved');
              }}
            />
          </InversePanel>
        </SlideDown>

        <SlideDown open={selectedRows.length > 0}>
          <SelectionBar
            count={selectedRows.length}
            onExport={() =>
              exportTableToCsv(table, `expenses-selected-${formatDateToString(new Date())}.csv`, selectedRows)
            }
            onDelete={() => deleteExpenses(selectedRows.map((row) => row.original.id))}
            onClear={() => table.resetRowSelection()}
          />
        </SlideDown>

        <DataTable table={table} emptyText={expenses.length === 0 ? 'No expenses yet.' : 'No expenses match.'} />

        {/* The total of what's on screen — follows the tab, the search and the dates. */}
        <div className="flex h-12 items-center justify-between border-t px-4 text-sm">
          <span className="text-muted-foreground">
            Total of {rows.length} {rows.length === 1 ? 'expense' : 'expenses'}
          </span>
          <span className="text-foreground font-semibold tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  );
}
