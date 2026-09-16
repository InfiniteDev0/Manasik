'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { BanknoteIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/workspace/data-table';
import { DetailTabs } from '@/components/workspace/detail-tabs';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDate, todayIso } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { enumLabel, statusLabel, t } from '@/lib/strings';
import { listInvoices, listPayments, type InvoiceRow, type PaymentRow } from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { PaymentForm } from './payment-form';

const INVOICE_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const;
const METHODS = ['MPESA', 'BANK_TRANSFER', 'CASH', 'CARD'] as const;

/**
 * The money page.
 *
 * <p>Two tabs rather than one table, because they answer opposite questions:
 * invoices are "who owes us what", payments are "what actually arrived".
 * Merging them produces a table where half the rows have no amount received.
 */
export function PaymentPage() {
  const router = useRouter();
  const { base } = useWorkspace();
  const [formOpen, setFormOpen] = React.useState(false);

  const invoices = useMockQuery(listInvoices);
  const payments = useMockQuery(listPayments);

  const collected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const overdue = invoices.filter((invoice) => invoice.status === 'OVERDUE');

  const monthPrefix = todayIso().slice(0, 7);
  const thisMonth = payments
    .filter((payment) => payment.paymentDate.startsWith(monthPrefix))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const invoiceColumns = React.useMemo<ColumnDef<InvoiceRow, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: t('payments.invoiceNumber'),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.number}</span>
        ),
      },
      {
        id: 'pilgrim',
        header: t('payments.pilgrim'),
        accessorFn: (row) => row.pilgrim?.fullName ?? '',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.pilgrim?.fullName ?? '—'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.package?.name ?? ''}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: t('payments.invoiceTotal'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMoney(row.original.total, row.original.currency)}
          </span>
        ),
      },
      {
        id: 'progress',
        header: t('payments.amountPaid'),
        accessorFn: (row) => row.amountPaid,
        cell: ({ row }) => {
          const percent =
            row.original.total > 0
              ? Math.min(Math.round((row.original.amountPaid / row.original.total) * 100), 100)
              : 100;

          return (
            <div className="w-32 space-y-1">
              <p className="tabular-nums">
                {formatMoney(row.original.amountPaid, row.original.currency)}
              </p>
              <Progress value={percent} />
            </div>
          );
        },
      },
      {
        id: 'balance',
        header: t('payments.balanceDue'),
        accessorFn: (row) => row.balanceDue,
        cell: ({ row }) => (
          <span
            className={
              row.original.balanceDue > 0
                ? 'whitespace-nowrap tabular-nums text-amber-600 dark:text-amber-400'
                : 'whitespace-nowrap tabular-nums text-muted-foreground'
            }
          >
            {formatMoney(row.original.balanceDue, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: t('payments.dueDate'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatDate(row.original.dueDate)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('common.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        filterFn: 'equalsString',
      },
    ],
    [],
  );

  const paymentColumns = React.useMemo<ColumnDef<PaymentRow, unknown>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: t('payments.reference'),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference}</span>
        ),
      },
      {
        id: 'pilgrim',
        header: t('payments.pilgrim'),
        accessorFn: (row) => row.pilgrim?.fullName ?? '',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.pilgrim?.fullName ?? '—'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.bookingReference ?? ''}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'paymentDate',
        header: t('payments.paymentDate'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatDate(row.original.paymentDate)}</span>
        ),
      },
      {
        accessorKey: 'method',
        header: t('payments.method'),
        cell: ({ row }) => enumLabel(row.original.method),
        filterFn: 'equalsString',
      },
      {
        accessorKey: 'externalReference',
        header: t('payments.externalReference'),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.externalReference ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: t('payments.amount'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatMoney(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: 'recordedBy',
        header: t('payments.recordedBy'),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.recordedBy}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('payments.title')}
        description={t('payments.subtitle')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-4" />
            {t('payments.record')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('payments.totalCollected')}
          value={formatMoney(collected)}
          icon={BanknoteIcon}
        />
        <StatCard label={t('dashboard.revenueThisMonth')} value={formatMoney(thisMonth)} />
        <StatCard
          label={t('payments.totalOutstanding')}
          value={formatMoney(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label={statusLabel('OVERDUE')}
          value={overdue.length}
          hint={overdue.length > 0 ? formatMoney(overdue.reduce((s, i) => s + i.balanceDue, 0)) : undefined}
          tone={overdue.length > 0 ? 'danger' : 'default'}
        />
      </div>

      <DetailTabs
        tabs={[
          {
            value: 'invoices',
            label: t('payments.invoices'),
            count: invoices.length,
            content: (
              <DataTable
                columns={invoiceColumns}
                data={invoices}
                searchPlaceholder={`${t('common.search')} ${t('payments.invoices').toLowerCase()}…`}
                filters={[
                  {
                    columnId: 'status',
                    label: t('common.status'),
                    options: INVOICE_STATUSES.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                    })),
                  },
                ]}
                onRowClick={(row) =>
                  row.booking ? router.push(`${base}/bookings/${row.booking.id}`) : undefined
                }
              />
            ),
          },
          {
            value: 'payments',
            label: t('payments.title'),
            count: payments.length,
            content: (
              <DataTable
                columns={paymentColumns}
                data={payments}
                searchPlaceholder={`${t('common.search')} ${t('payments.title').toLowerCase()}…`}
                filters={[
                  {
                    columnId: 'method',
                    label: t('payments.method'),
                    options: METHODS.map((method) => ({
                      value: method,
                      label: enumLabel(method),
                    })),
                  },
                ]}
                emptyState={
                  <EmptyState
                    icon={BanknoteIcon}
                    title={t('payments.empty')}
                    description={t('payments.emptyHint')}
                    action={
                      <Button onClick={() => setFormOpen(true)}>
                        <PlusIcon className="size-4" />
                        {t('payments.record')}
                      </Button>
                    }
                  />
                }
              />
            ),
          },
        ]}
      />

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
