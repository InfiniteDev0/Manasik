'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon, UsersIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/workspace/data-table';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatMoney } from '@/lib/money';
import { enumLabel, statusLabel, t } from '@/lib/strings';
import { listPilgrims, type PilgrimRow } from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { PilgrimAvatar } from './pilgrim-avatar';
import { PilgrimForm } from './pilgrim-form';

const PILGRIM_STATUSES = [
  'LEAD',
  'REGISTERED',
  'CONFIRMED',
  'TRAVELLING',
  'COMPLETED',
  'CANCELLED',
] as const;

export function PilgrimList() {
  const router = useRouter();
  const { base } = useWorkspace();
  const [formOpen, setFormOpen] = React.useState(false);

  const rows = useMockQuery(listPilgrims);

  const confirmed = rows.filter((row) => row.status === 'CONFIRMED').length;
  const leads = rows.filter((row) => row.status === 'LEAD').length;
  const outstanding = rows.reduce((sum, row) => sum + row.balanceDue, 0);

  const columns = React.useMemo<ColumnDef<PilgrimRow, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: t('pilgrims.fullName'),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <PilgrimAvatar name={row.original.fullName} />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.phone}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'pilgrimageType',
        header: t('pilgrims.pilgrimageType'),
        cell: ({ row }) => enumLabel(row.original.pilgrimageType),
        filterFn: 'equalsString',
      },
      {
        id: 'package',
        header: t('pilgrims.currentPackage'),
        accessorFn: (row) => row.currentPackage?.name ?? '',
        cell: ({ row }) =>
          row.original.currentPackage ? (
            <span className="text-sm">{row.original.currentPackage.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{t('common.none')}</span>
          ),
      },
      {
        id: 'documents',
        header: t('pilgrims.documents'),
        accessorFn: (row) => row.documentsApproved,
        cell: ({ row }) => {
          const { documentsApproved, documentsRequired } = row.original;
          const complete = documentsApproved === documentsRequired;

          return (
            <span
              className={
                complete
                  ? 'tabular-nums text-emerald-600 dark:text-emerald-400'
                  : 'tabular-nums text-muted-foreground'
              }
            >
              {t('pilgrims.documentsProgress', {
                approved: documentsApproved,
                required: documentsRequired,
              })}
            </span>
          );
        },
      },
      {
        id: 'balance',
        header: t('pilgrims.balance'),
        accessorFn: (row) => row.balanceDue,
        cell: ({ row }) => (
          <span
            className={
              row.original.balanceDue > 0
                ? 'tabular-nums text-amber-600 dark:text-amber-400'
                : 'tabular-nums text-muted-foreground'
            }
          >
            {formatMoney(row.original.balanceDue)}
          </span>
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
        title={t('pilgrims.title')}
        description={t('pilgrims.subtitle')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-4" />
            {t('pilgrims.create')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={statusLabel('CONFIRMED')} value={confirmed} icon={UsersIcon} />
        <StatCard label={statusLabel('LEAD')} value={leads} />
        <StatCard
          label={t('payments.totalOutstanding')}
          value={formatMoney(outstanding)}
          tone={outstanding > 0 ? 'warning' : 'default'}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder={`${t('common.search')} ${t('pilgrims.title').toLowerCase()}…`}
        filters={[
          {
            columnId: 'pilgrimageType',
            label: t('pilgrims.pilgrimageType'),
            options: [
              { value: 'UMRAH', label: enumLabel('UMRAH') },
              { value: 'HAJJ', label: enumLabel('HAJJ') },
            ],
          },
          {
            columnId: 'status',
            label: t('common.status'),
            options: PILGRIM_STATUSES.map((status) => ({
              value: status,
              label: statusLabel(status),
            })),
          },
        ]}
        onRowClick={(row) => router.push(`${base}/pilgrims/${row.id}`)}
        emptyState={
          <EmptyState
            icon={UsersIcon}
            title={t('pilgrims.empty')}
            description={t('pilgrims.emptyHint')}
            action={
              <Button onClick={() => setFormOpen(true)}>
                <PlusIcon className="size-4" />
                {t('pilgrims.create')}
              </Button>
            }
          />
        }
      />

      <PilgrimForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
