'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/workspace/data-table';
import { DetailField, DetailFieldGrid } from '@/components/workspace/detail-field';
import { DetailTabs } from '@/components/workspace/detail-tabs';
import { PageHeader } from '@/components/workspace/page-header';
import { StatusBadge } from '@/components/workspace/status-badge';
import { DocumentChecklist } from '@/features/documents/document-checklist';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { ageFrom, formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { enumLabel, t } from '@/lib/strings';
import {
  getPilgrim,
  listBookings,
  listPayments,
  type BookingRow,
  type PaymentRow,
} from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { PilgrimAvatar } from './pilgrim-avatar';
import { PilgrimForm } from './pilgrim-form';

export function PilgrimDetail({ pilgrimId }: { pilgrimId: string }) {
  const router = useRouter();
  const { base } = useWorkspace();
  const [editOpen, setEditOpen] = React.useState(false);

  const pilgrim = useMockQuery(() => getPilgrim(pilgrimId));
  const bookings = useMockQuery(() =>
    listBookings().filter((booking) => booking.pilgrimId === pilgrimId),
  );
  const payments = useMockQuery(() =>
    listPayments().filter((payment) => payment.pilgrim?.id === pilgrimId),
  );

  if (!pilgrim) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('pilgrims.title')} />
        <p className="text-sm text-muted-foreground">This pilgrim no longer exists.</p>
        <Button variant="outline" render={<Link href={`${base}/pilgrims`} />}>
          <ArrowLeftIcon className="size-4" />
          {t('pilgrims.title')}
        </Button>
      </div>
    );
  }

  const age = ageFrom(pilgrim.dateOfBirth);

  const bookingColumns: ColumnDef<BookingRow, unknown>[] = [
    {
      accessorKey: 'reference',
      header: t('bookings.reference'),
      cell: ({ row }) => <span className="font-medium">{row.original.reference}</span>,
    },
    {
      id: 'package',
      header: t('bookings.package'),
      accessorFn: (row) => row.package?.name ?? '',
    },
    {
      accessorKey: 'bookingDate',
      header: t('bookings.bookingDate'),
      cell: ({ row }) => formatDate(row.original.bookingDate),
    },
    {
      id: 'total',
      header: t('bookings.total'),
      accessorFn: (row) => row.totalAmount,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatMoney(row.original.totalAmount)}</span>
      ),
    },
    {
      id: 'balance',
      header: t('bookings.balance'),
      accessorFn: (row) => row.balanceDue,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatMoney(row.original.balanceDue)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  const paymentColumns: ColumnDef<PaymentRow, unknown>[] = [
    {
      accessorKey: 'reference',
      header: t('payments.reference'),
      cell: ({ row }) => <span className="font-medium">{row.original.reference}</span>,
    },
    {
      accessorKey: 'paymentDate',
      header: t('payments.paymentDate'),
      cell: ({ row }) => formatDate(row.original.paymentDate),
    },
    {
      accessorKey: 'method',
      header: t('payments.method'),
      cell: ({ row }) => enumLabel(row.original.method),
    },
    {
      accessorKey: 'externalReference',
      header: t('payments.externalReference'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.externalReference ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('payments.amount'),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatMoney(row.original.amount)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 text-muted-foreground"
        render={<Link href={`${base}/pilgrims`} />}
      >
        <ArrowLeftIcon className="size-4" />
        {t('pilgrims.title')}
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <PilgrimAvatar name={pilgrim.fullName} size="lg" />
          <div className="min-w-0">
            <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
              {pilgrim.fullName}
            </h1>
            {pilgrim.arabicName ? (
              <p dir="rtl" className="truncate text-sm text-muted-foreground">
                {pilgrim.arabicName}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={pilgrim.status} />
              <span className="text-sm text-muted-foreground">
                {enumLabel(pilgrim.pilgrimageType)}
              </span>
              {age !== null ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{age} years</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <PencilIcon className="size-4" />
          {t('common.edit')}
        </Button>
      </div>

      {/* Medical and access needs sit above the fold, not buried in a tab —
          they change how staff handle the person at the airport. */}
      {pilgrim.medicalNotes || pilgrim.specialRequirements ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/25 dark:bg-amber-500/5">
          <CardContent className="space-y-2">
            {pilgrim.medicalNotes ? (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {t('pilgrims.medicalNotes')}
                </p>
                <p className="text-sm">{pilgrim.medicalNotes}</p>
              </div>
            ) : null}
            {pilgrim.specialRequirements ? (
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {t('pilgrims.specialRequirements')}
                </p>
                <p className="text-sm">{pilgrim.specialRequirements}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <DetailTabs
        tabs={[
          {
            value: 'overview',
            label: t('pilgrims.tabOverview'),
            content: (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Personal &amp; contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailFieldGrid>
                      <DetailField label={t('pilgrims.gender')} value={enumLabel(pilgrim.gender)} />
                      <DetailField
                        label={t('pilgrims.dateOfBirth')}
                        value={formatDate(pilgrim.dateOfBirth)}
                      />
                      <DetailField label={t('pilgrims.nationality')} value={pilgrim.nationality} />
                      <DetailField label={t('pilgrims.phone')} value={pilgrim.phone} />
                      <DetailField label={t('pilgrims.email')} value={pilgrim.email} />
                      <DetailField
                        label={t('pilgrims.city')}
                        value={[pilgrim.city, pilgrim.country].filter(Boolean).join(', ')}
                      />
                    </DetailFieldGrid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('pilgrims.emergencyContact')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailFieldGrid>
                      <DetailField
                        label={t('pilgrims.emergencyContactName')}
                        value={pilgrim.emergencyContactName}
                      />
                      <DetailField
                        label={t('pilgrims.emergencyContactPhone')}
                        value={pilgrim.emergencyContactPhone}
                      />
                      <DetailField
                        label={t('pilgrims.emergencyContactRelation')}
                        value={pilgrim.emergencyContactRelation}
                      />
                    </DetailFieldGrid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Travel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DetailFieldGrid>
                      <DetailField
                        label={t('pilgrims.passportNumber')}
                        value={
                          pilgrim.passportNumber ? (
                            <span className="font-mono">{pilgrim.passportNumber}</span>
                          ) : null
                        }
                      />
                      <DetailField
                        label={t('pilgrims.passportExpiry')}
                        value={
                          pilgrim.passportExpiry ? formatDate(pilgrim.passportExpiry) : null
                        }
                      />
                      <DetailField
                        label={t('pilgrims.visaStatus')}
                        value={<StatusBadge status={pilgrim.visaStatus} />}
                      />
                      <DetailField
                        label={t('pilgrims.currentPackage')}
                        value={
                          pilgrim.currentPackage ? (
                            <Link
                              href={`${base}/packages/${pilgrim.currentPackage.id}`}
                              className="underline underline-offset-4 hover:text-foreground"
                            >
                              {pilgrim.currentPackage.name}
                            </Link>
                          ) : null
                        }
                      />
                      <DetailField
                        label={t('pilgrims.currentGroup')}
                        value={
                          pilgrim.currentGroup ? (
                            <Link
                              href={`${base}/groups/${pilgrim.currentGroup.id}`}
                              className="underline underline-offset-4 hover:text-foreground"
                            >
                              {pilgrim.currentGroup.name}
                            </Link>
                          ) : null
                        }
                      />
                      <DetailField
                        label={t('pilgrims.balance')}
                        value={formatMoney(pilgrim.balanceDue)}
                      />
                    </DetailFieldGrid>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: 'bookings',
            label: t('pilgrims.tabBookings'),
            count: bookings.length,
            content: (
              <DataTable
                columns={bookingColumns}
                data={bookings}
                onRowClick={(row) => router.push(`${base}/bookings/${row.id}`)}
                pageSize={10}
              />
            ),
          },
          {
            value: 'documents',
            label: t('pilgrims.tabDocuments'),
            count: pilgrim.documentsApproved,
            content: (
              <DocumentChecklist
                pilgrimId={pilgrim.id}
                returnDate={pilgrim.currentPackage?.returnDate ?? null}
              />
            ),
          },
          {
            value: 'payments',
            label: t('pilgrims.tabPayments'),
            count: payments.length,
            content: <DataTable columns={paymentColumns} data={payments} pageSize={10} />,
          },
        ]}
      />

      <PilgrimForm open={editOpen} onOpenChange={setEditOpen} initial={pilgrim} />
    </div>
  );
}
