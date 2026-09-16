'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon, TicketIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/workspace/data-table';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { statusLabel, t } from '@/lib/strings';
import { listBookings, type BookingRow } from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { BookingForm } from './booking-form';

const BOOKING_STATUSES = ['DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;

export function BookingList() {
  const router = useRouter();
  const { base } = useWorkspace();
  const [formOpen, setFormOpen] = React.useState(false);

  const rows = useMockQuery(listBookings);

  const confirmed = rows.filter((row) => row.status === 'CONFIRMED').length;
  const pending = rows.filter((row) => row.status === 'PENDING').length;
  const outstanding = rows
    .filter((row) => row.status !== 'CANCELLED')
    .reduce((sum, row) => sum + row.balanceDue, 0);

  const columns = React.useMemo<ColumnDef<BookingRow, unknown>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: t('bookings.reference'),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference}</span>
        ),
      },
      {
        id: 'pilgrim',
        header: t('bookings.pilgrim'),
        accessorFn: (row) => row.pilgrim?.fullName ?? '',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.pilgrim?.fullName ?? '—'}</span>
        ),
      },
      {
        id: 'package',
        header: t('bookings.package'),
        accessorFn: (row) => row.package?.name ?? '',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.package?.name ?? '—'}</p>
            {row.original.package ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(row.original.package.departureDate)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'group',
        header: t('bookings.group'),
        accessorFn: (row) => row.group?.name ?? '',
        cell: ({ row }) =>
          row.original.group ? (
            <span className="text-sm">{row.original.group.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{t('bookings.unassigned')}</span>
          ),
      },
      {
        id: 'total',
        header: t('bookings.total'),
        accessorFn: (row) => row.totalAmount,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMoney(row.original.totalAmount)}
          </span>
        ),
      },
      {
        id: 'balance',
        header: t('bookings.balance'),
        accessorFn: (row) => row.balanceDue,
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p
              className={
                row.original.balanceDue > 0
                  ? 'tabular-nums text-amber-600 dark:text-amber-400'
                  : 'tabular-nums text-muted-foreground'
              }
            >
              {formatMoney(row.original.balanceDue)}
            </p>
            {row.original.paymentStatus ? (
              <p className="text-xs text-muted-foreground">
                {statusLabel(row.original.paymentStatus)}
              </p>
            ) : null}
          </div>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('bookings.title')}
        description={t('bookings.subtitle')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-4" />
            {t('bookings.create')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={statusLabel('CONFIRMED')} value={confirmed} icon={TicketIcon} />
        <StatCard
          label={statusLabel('PENDING')}
          value={pending}
          tone={pending > 0 ? 'warning' : 'default'}
        />
        <StatCard label={t('payments.totalOutstanding')} value={formatMoney(outstanding)} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder={`${t('common.search')} ${t('bookings.title').toLowerCase()}…`}
        filters={[
          {
            columnId: 'status',
            label: t('common.status'),
            options: BOOKING_STATUSES.map((status) => ({
              value: status,
              label: statusLabel(status),
            })),
          },
        ]}
        onRowClick={(row) => router.push(`${base}/bookings/${row.id}`)}
        emptyState={
          <EmptyState
            icon={TicketIcon}
            title={t('bookings.empty')}
            description={t('bookings.emptyHint')}
            action={
              <Button onClick={() => setFormOpen(true)}>
                <PlusIcon className="size-4" />
                {t('bookings.create')}
              </Button>
            }
          />
        }
      />

      <BookingForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
