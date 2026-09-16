'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/workspace/data-table';
import { DetailField, DetailFieldGrid } from '@/components/workspace/detail-field';
import { DetailTabs } from '@/components/workspace/detail-tabs';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDate, formatDateRange } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { enumLabel, t } from '@/lib/strings';
import { bookingsForPackage, getPackage, type BookingRow } from '@/mocks/queries';
import { deletePackage, useMockQuery } from '@/mocks/store';

import { PackageForm } from './package-form';

export function PackageDetail({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { base } = useWorkspace();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const pkg = useMockQuery(() => getPackage(packageId));
  const bookings = useMockQuery(() => bookingsForPackage(packageId));

  if (!pkg) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('packages.title')} />
        <p className="text-sm text-muted-foreground">This package no longer exists.</p>
        <Button variant="outline" render={<Link href={`${base}/packages`} />}>
          <ArrowLeftIcon className="size-4" />
          {t('packages.title')}
        </Button>
      </div>
    );
  }

  const bookingColumns: ColumnDef<BookingRow, unknown>[] = [
    {
      accessorKey: 'reference',
      header: t('bookings.reference'),
      cell: ({ row }) => <span className="font-medium">{row.original.reference}</span>,
    },
    {
      id: 'pilgrim',
      header: t('bookings.pilgrim'),
      accessorFn: (row) => row.pilgrim?.fullName ?? '',
    },
    {
      accessorKey: 'bookingDate',
      header: t('bookings.bookingDate'),
      cell: ({ row }) => formatDate(row.original.bookingDate),
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

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 text-muted-foreground"
        render={<Link href={`${base}/packages`} />}
      >
        <ArrowLeftIcon className="size-4" />
        {t('packages.title')}
      </Button>

      <PageHeader
        title={pkg.name}
        description={pkg.destination}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              {t('common.edit')}
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon className="size-4 text-destructive" />
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={pkg.status} />
        <span className="text-sm text-muted-foreground">{enumLabel(pkg.type)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">
          {formatDateRange(pkg.departureDate, pkg.returnDate)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('packages.price')} value={formatMoney(pkg.pricePerPilgrim, pkg.currency)} />
        <StatCard
          label={t('packages.booked')}
          value={t('packages.seatsOf', { booked: pkg.bookedCount, capacity: pkg.capacity })}
          hint={`${pkg.seatsRemaining} ${t('packages.seatsRemaining').toLowerCase()}`}
          // Nearly full is worth noticing before a seat is oversold.
          tone={pkg.seatsRemaining === 0 ? 'warning' : 'default'}
        />
        <StatCard
          label={t('packages.revenueCollected')}
          value={formatMoney(pkg.revenueCollected, pkg.currency)}
        />
        <StatCard
          label={t('packages.duration')}
          value={t('packages.durationValue', { count: pkg.durationDays })}
        />
      </div>

      <DetailTabs
        tabs={[
          {
            value: 'overview',
            label: t('common.details'),
            content: (
              <div className="space-y-6">
                <Card>
                  <CardContent>
                    <DetailFieldGrid>
                      <DetailField label={t('packages.type')} value={enumLabel(pkg.type)} />
                      <DetailField label={t('packages.destination')} value={pkg.destination} />
                      <DetailField
                        label={t('packages.departureDate')}
                        value={formatDate(pkg.departureDate)}
                      />
                      <DetailField
                        label={t('packages.returnDate')}
                        value={formatDate(pkg.returnDate)}
                      />
                      <DetailField
                        label={t('packages.deposit')}
                        value={pkg.depositAmount > 0 ? formatMoney(pkg.depositAmount, pkg.currency) : null}
                      />
                      <DetailField
                        label={t('packages.paymentDue')}
                        value={pkg.paymentDueDate ? formatDate(pkg.paymentDueDate) : null}
                      />
                    </DetailFieldGrid>

                    {pkg.description ? (
                      <div className="mt-6 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t('packages.description')}
                        </p>
                        <p className="text-sm leading-relaxed">{pkg.description}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ListCard
                    title={t('packages.inclusions')}
                    items={pkg.inclusions}
                    tone="included"
                  />
                  <ListCard
                    title={t('packages.exclusions')}
                    items={pkg.exclusions}
                    tone="excluded"
                  />
                </div>

                {pkg.itinerary ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('packages.itinerary')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{pkg.itinerary}</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ),
          },
          {
            value: 'bookings',
            label: t('bookings.title'),
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
        ]}
      />

      <PackageForm open={editOpen} onOpenChange={setEditOpen} initial={pkg} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('packages.deleteConfirm')}</DialogTitle>
            <DialogDescription>{t('packages.deleteWarning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deletePackage(pkg.id);
                router.push(`${base}/packages`);
              }}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'included' | 'excluded';
}) {
  const Icon = tone === 'included' ? CheckIcon : XIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('common.none')}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Icon
                  className={
                    tone === 'included'
                      ? 'mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                      : 'mt-0.5 size-4 shrink-0 text-muted-foreground'
                  }
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
