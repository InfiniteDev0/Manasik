'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { PackageIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { DataTable } from '@/components/workspace/data-table';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { enumLabel, statusLabel, t } from '@/lib/strings';
import { listPackages, type PackageRow } from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { PackageForm } from './package-form';

export function PackageList() {
  const router = useRouter();
  const { base } = useWorkspace();
  const [formOpen, setFormOpen] = React.useState(false);

  const rows = useMockQuery(listPackages);

  const active = rows.filter((row) => row.status === 'ACTIVE');
  const seatsAvailable = active.reduce((sum, row) => sum + row.seatsRemaining, 0);
  const collected = rows.reduce((sum, row) => sum + row.revenueCollected, 0);

  const columns = React.useMemo<ColumnDef<PackageRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('packages.name'),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.destination}</p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('packages.type'),
        cell: ({ row }) => enumLabel(row.original.type),
        filterFn: 'equalsString',
      },
      {
        accessorKey: 'departureDate',
        header: t('packages.departureDate'),
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p>{formatDate(row.original.departureDate)}</p>
            <p className="text-xs text-muted-foreground">
              {t('packages.durationValue', { count: row.original.durationDays })}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'pricePerPilgrim',
        header: t('packages.price'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMoney(row.original.pricePerPilgrim, row.original.currency)}
          </span>
        ),
      },
      {
        id: 'seats',
        header: t('packages.booked'),
        // Sorting on the raw booked count rather than the rendered "3 of 45"
        // string, which would sort lexically and put 10 before 3.
        accessorFn: (row) => row.bookedCount,
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="tabular-nums">
              {t('packages.seatsOf', {
                booked: row.original.bookedCount,
                capacity: row.original.capacity,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.seatsRemaining} {t('packages.seatsRemaining').toLowerCase()}
            </p>
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
        title={t('packages.title')}
        description={t('packages.subtitle')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-4" />
            {t('packages.create')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={statusLabel('ACTIVE')} value={active.length} icon={PackageIcon} />
        <StatCard label={t('packages.seatsRemaining')} value={seatsAvailable} />
        <StatCard label={t('packages.revenueCollected')} value={formatMoney(collected)} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder={`${t('common.search')} ${t('packages.title').toLowerCase()}…`}
        filters={[
          {
            columnId: 'type',
            label: t('packages.type'),
            options: [
              { value: 'UMRAH', label: enumLabel('UMRAH') },
              { value: 'HAJJ', label: enumLabel('HAJJ') },
            ],
          },
          {
            columnId: 'status',
            label: t('common.status'),
            options: (['DRAFT', 'ACTIVE', 'SOLD_OUT', 'COMPLETED'] as const).map((status) => ({
              value: status,
              label: statusLabel(status),
            })),
          },
        ]}
        onRowClick={(row) => router.push(`${base}/packages/${row.id}`)}
        emptyState={
          <EmptyState
            icon={PackageIcon}
            title={t('packages.empty')}
            description={t('packages.emptyHint')}
            action={
              <Button onClick={() => setFormOpen(true)}>
                <PlusIcon className="size-4" />
                {t('packages.create')}
              </Button>
            }
          />
        }
      />

      <PackageForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
