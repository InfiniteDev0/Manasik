'use client';

import { AlertTriangleIcon, ArrowLeftIcon, CheckIcon, PencilIcon, PlusIcon, XIcon } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { DetailField, DetailFieldGrid } from '@/components/workspace/detail-field';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { PaymentForm } from '@/features/payments/payment-form';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDate } from '@/lib/dates';
import { formatMoney, paidPercentage } from '@/lib/money';
import { enumLabel, t } from '@/lib/strings';
import { departureBlockers, getBooking, paymentsForInvoice } from '@/mocks/queries';
import { setBookingStatus, useMockQuery } from '@/mocks/store';

import { BookingForm } from './booking-form';

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { base } = useWorkspace();

  const [editOpen, setEditOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const booking = useMockQuery(() => getBooking(bookingId));
  const payments = useMockQuery(() =>
    booking?.invoice ? paymentsForInvoice(booking.invoice.id) : [],
  );

  if (!booking) {
    return (
      <div className="space-y-4">
        <PageHeader title={t('bookings.title')} />
        <p className="text-sm text-muted-foreground">This booking no longer exists.</p>
        <Button variant="outline" render={<Link href={`${base}/bookings`} />}>
          <ArrowLeftIcon className="size-4" />
          {t('bookings.title')}
        </Button>
      </div>
    );
  }

  const blockers = departureBlockers(booking);
  const percentPaid = booking.invoice ? paidPercentage(booking.invoice, payments) : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 text-muted-foreground"
        render={<Link href={`${base}/bookings`} />}
      >
        <ArrowLeftIcon className="size-4" />
        {t('bookings.title')}
      </Button>

      <PageHeader
        title={booking.reference}
        description={booking.pilgrim?.fullName}
        actions={
          <>
            {booking.status === 'PENDING' ? (
              <Button onClick={() => setBookingStatus(booking.id, 'CONFIRMED')}>
                <CheckIcon className="size-4" />
                {t('bookings.confirm')}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              {t('common.edit')}
            </Button>
            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <XIcon className="size-4 text-destructive" />
                <span className="sr-only">{t('bookings.cancel')}</span>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={booking.status} />
        {booking.paymentStatus ? <StatusBadge status={booking.paymentStatus} /> : null}
      </div>

      {/* Everything standing between this pilgrim and the aeroplane, in one
          place — the question staff actually ask of a booking. */}
      {blockers.length > 0 && booking.status !== 'CANCELLED' ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/25 dark:bg-amber-500/5">
          <CardContent className="flex gap-3">
            <AlertTriangleIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium">{t('groups.notReady')}</p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('bookings.total')} value={formatMoney(booking.totalAmount)} />
        <StatCard label={t('bookings.paid')} value={formatMoney(booking.amountPaid)} />
        <StatCard
          label={t('bookings.balance')}
          value={formatMoney(booking.balanceDue)}
          tone={booking.balanceDue > 0 ? 'warning' : 'default'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('payments.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percentPaid}% settled</span>
              {booking.invoice ? <span>{t('payments.dueDate')} {formatDate(booking.invoice.dueDate)}</span> : null}
            </div>
            <Progress value={percentPaid} />
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('payments.empty')}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatMoney(payment.amount)}{' '}
                      <span className="font-normal text-muted-foreground">
                        · {enumLabel(payment.method)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(payment.paymentDate)}
                      {payment.externalReference ? ` · ${payment.externalReference}` : ''}
                      {payment.note ? ` · ${payment.note}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {payment.reference}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {booking.balanceDue > 0 && booking.status !== 'CANCELLED' ? (
            <Button variant="outline" size="sm" onClick={() => setPayOpen(true)}>
              <PlusIcon className="size-4" />
              {t('payments.record')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('common.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailFieldGrid>
            <DetailField
              label={t('bookings.pilgrim')}
              value={
                booking.pilgrim ? (
                  <Link
                    href={`${base}/pilgrims/${booking.pilgrim.id}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {booking.pilgrim.fullName}
                  </Link>
                ) : null
              }
            />
            <DetailField
              label={t('bookings.package')}
              value={
                booking.package ? (
                  <Link
                    href={`${base}/packages/${booking.package.id}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {booking.package.name}
                  </Link>
                ) : null
              }
            />
            <DetailField
              label={t('bookings.group')}
              value={
                booking.group ? (
                  <Link
                    href={`${base}/groups/${booking.group.id}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {booking.group.name}
                  </Link>
                ) : null
              }
            />
            <DetailField
              label={t('bookings.bookingDate')}
              value={formatDate(booking.bookingDate)}
            />
            <DetailField
              label={t('bookings.packagePrice')}
              value={formatMoney(booking.packagePrice)}
            />
            <DetailField
              label={t('bookings.discount')}
              value={booking.discount > 0 ? formatMoney(booking.discount) : null}
            />
            <DetailField
              label={t('payments.invoiceNumber')}
              value={booking.invoice?.number}
            />
            <DetailField label={t('bookings.notes')} value={booking.notes} />
          </DetailFieldGrid>
        </CardContent>
      </Card>

      <BookingForm open={editOpen} onOpenChange={setEditOpen} initial={booking} />
      <PaymentForm
        open={payOpen}
        onOpenChange={setPayOpen}
        invoiceId={booking.invoice?.id}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('bookings.cancelConfirm')}</DialogTitle>
            <DialogDescription>{t('bookings.cancelWarning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t('common.close')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setBookingStatus(booking.id, 'CANCELLED');
                setCancelOpen(false);
                router.refresh();
              }}
            >
              {t('bookings.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
