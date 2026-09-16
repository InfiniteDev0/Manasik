'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserMinusIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { t } from '@/lib/strings';
import {
  bookingsForGroup,
  daysUntil,
  departureBlockers,
  getGroup,
  listBookings,
  type BookingRow,
} from '@/mocks/queries';
import { assignBookingToGroup, deleteGroup, useMockQuery } from '@/mocks/store';

import { GroupForm } from './group-form';

export function GroupDetail({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { base } = useWorkspace();

  const [editOpen, setEditOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const group = useMockQuery(() => getGroup(groupId));
  const members = useMockQuery(() => bookingsForGroup(groupId));

  if (!group) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('groups.title')} />
        <p className="text-sm text-muted-foreground">This group no longer exists.</p>
        <Button variant="outline" render={<Link href={`${base}/groups`} />}>
          <ArrowLeftIcon className="size-4" />
          {t('groups.title')}
        </Button>
      </div>
    );
  }

  const days = daysUntil(group.departureDate);
  const isReady = group.readinessIssues.length === 0;

  const memberColumns: ColumnDef<BookingRow, unknown>[] = [
    {
      id: 'pilgrim',
      header: t('bookings.pilgrim'),
      accessorFn: (row) => row.pilgrim?.fullName ?? '',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.pilgrim?.fullName ?? '—'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.original.pilgrim?.phone ?? ''}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'reference',
      header: t('bookings.reference'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference}</span>,
    },
    {
      id: 'passport',
      header: t('pilgrims.passportNumber'),
      accessorFn: (row) => row.pilgrim?.passportNumber ?? '',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.pilgrim?.passportNumber ?? '—'}</span>
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
      id: 'readiness',
      header: t('groups.readiness'),
      accessorFn: (row) => departureBlockers(row).length,
      cell: ({ row }) => {
        const blockers = departureBlockers(row.original);
        if (blockers.length === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" aria-hidden />
              {t('groups.ready')}
            </span>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
            title={blockers.join(' · ')}
          >
            <AlertTriangleIcon className="size-3.5" aria-hidden />
            {blockers[0]}
            {blockers.length > 1 ? ` +${blockers.length - 1}` : ''}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={(event) => {
            // The row itself navigates to the booking — removal must not.
            event.stopPropagation();
            assignBookingToGroup(row.original.id, null);
          }}
        >
          <UserMinusIcon className="size-3.5" />
          <span className="sr-only">{t('groups.removeFromGroup')}</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 text-muted-foreground"
        render={<Link href={`${base}/groups`} />}
      >
        <ArrowLeftIcon className="size-4" />
        {t('groups.title')}
      </Button>

      <PageHeader
        title={group.name}
        description={group.package?.name}
        actions={
          <>
            <Button onClick={() => setAssignOpen(true)}>
              <PlusIcon className="size-4" />
              {t('groups.assignPilgrims')}
            </Button>
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

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusBadge status={group.status} />
        <span>{formatDateRange(group.departureDate, group.returnDate)}</span>
        {group.status !== 'COMPLETED' && days >= 0 ? (
          <>
            <span>·</span>
            <span className={days <= 14 ? 'text-amber-600 dark:text-amber-400' : ''}>
              {days === 0 ? t('dashboard.departsToday') : t('dashboard.daysAway', { count: days })}
            </span>
          </>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('groups.members')}
          value={t('groups.membersOf', { count: group.pilgrimCount, capacity: group.capacity })}
          hint={`${group.seatsRemaining} ${t('groups.seatsRemaining').toLowerCase()}`}
        />
        <StatCard label={t('groups.guide')} value={group.guideName ?? t('groups.noGuide')} />
        <StatCard
          label={t('groups.readiness')}
          value={isReady ? t('groups.ready') : t('groups.notReady')}
          tone={isReady ? 'default' : 'warning'}
        />
        <StatCard
          label={t('groups.blockedCount', { count: group.blockedCount })}
          value={group.blockedCount}
          tone={group.blockedCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <DetailTabs
        tabs={[
          {
            value: 'members',
            label: t('groups.tabMembers'),
            count: members.length,
            content: (
              <DataTable
                columns={memberColumns}
                data={members}
                searchPlaceholder={`${t('common.search')} ${t('groups.members').toLowerCase()}…`}
                onRowClick={(row) => router.push(`${base}/bookings/${row.id}`)}
                pageSize={30}
              />
            ),
          },
          {
            value: 'logistics',
            label: t('groups.tabLogistics'),
            content: (
              <Card>
                <CardContent className="space-y-6">
                  <DetailFieldGrid>
                    <DetailField label={t('groups.meetingPoint')} value={group.meetingPoint} />
                    <DetailField
                      label={t('groups.departureDate')}
                      value={formatDate(group.departureDate)}
                    />
                    <DetailField
                      label={t('groups.returnDate')}
                      value={formatDate(group.returnDate)}
                    />
                  </DetailFieldGrid>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <LogisticsBlock label={t('groups.flightNotes')} value={group.flightNotes} />
                    <LogisticsBlock label={t('groups.hotelNotes')} value={group.hotelNotes} />
                    <LogisticsBlock
                      label={t('groups.transportNotes')}
                      value={group.transportNotes}
                    />
                    <LogisticsBlock label={t('groups.itinerary')} value={group.itinerary} />
                  </div>

                  {group.notes ? (
                    <LogisticsBlock label={t('groups.notes')} value={group.notes} />
                  ) : null}
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'readiness',
            label: t('groups.tabReadiness'),
            count: group.blockedCount,
            content: (
              <div className="space-y-4">
                {group.readinessIssues.length > 0 ? (
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/25 dark:bg-amber-500/5">
                    <CardContent className="flex gap-3">
                      <AlertTriangleIcon
                        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden
                      />
                      <ul className="space-y-0.5 text-sm">
                        {group.readinessIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-emerald-500/5">
                    <CardContent className="flex items-center gap-3">
                      <CheckCircle2Icon
                        className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden
                      />
                      <p className="text-sm">{t('groups.ready')}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('groups.manifest')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('common.none')}</p>
                    ) : (
                      <ul className="divide-y">
                        {members.map((member) => {
                          const blockers = departureBlockers(member);

                          return (
                            <li key={member.id} className="flex items-start gap-3 py-3">
                              {blockers.length === 0 ? (
                                <CheckCircle2Icon
                                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                                  aria-hidden
                                />
                              ) : (
                                <AlertTriangleIcon
                                  className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                                  aria-hidden
                                />
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {member.pilgrim?.fullName ?? '—'}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {blockers.length === 0 ? t('groups.ready') : blockers.join(' · ')}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />

      <GroupForm open={editOpen} onOpenChange={setEditOpen} initial={group} />
      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        groupId={group.id}
        packageId={group.packageId}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this group?</DialogTitle>
            <DialogDescription>
              Its members are unassigned rather than deleted — the bookings stay.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteGroup(group.id);
                router.push(`${base}/groups`);
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

function LogisticsBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {value || <span className="text-muted-foreground/60 italic">{t('common.notSet')}</span>}
      </p>
    </div>
  );
}

/**
 * Assigns unassigned bookings to this group.
 *
 * <p>Only bookings on the same package are offered. A group is one departure
 * of one trip, so a booking from a different package could never travel with
 * it — showing those would only invite a mistake.
 */
function AssignDialog({
  open,
  onOpenChange,
  groupId,
  packageId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  packageId: string;
}) {
  const candidates = useMockQuery(() =>
    listBookings().filter(
      (booking) =>
        booking.packageId === packageId &&
        booking.groupId === null &&
        booking.status !== 'CANCELLED',
    ),
  );

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  function toggle(bookingId: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('groups.assignPilgrims')}</DialogTitle>
          <DialogDescription>
            Unassigned bookings on this package.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Every booking on this package is already in a group.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {candidates.map((booking) => (
              <li key={booking.id}>
                <label className="flex cursor-pointer items-center gap-3 p-3">
                  <Checkbox
                    checked={selected.has(booking.id)}
                    onCheckedChange={() => toggle(booking.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {booking.pilgrim?.fullName ?? '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.reference} · {formatMoney(booking.balanceDue)}{' '}
                      {t('bookings.balance').toLowerCase()}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </label>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={selected.size === 0}
            onClick={() => {
              for (const bookingId of selected) {
                assignBookingToGroup(bookingId, groupId);
              }
              onOpenChange(false);
            }}
          >
            {t('common.add')}
            {selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
