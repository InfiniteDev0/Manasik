'use client';

import {
  AlertTriangleIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  PlaneTakeoffIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { useCurrentUser } from '@/features/auth/current-user';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDateRange, formatRelative } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { t } from '@/lib/strings';
import {
  dashboardSummary,
  daysUntil,
  listInvoices,
  recentActivity,
  upcomingDepartures,
} from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

/**
 * The dashboard.
 *
 * <p>Built last on purpose: it only aggregates what the other pages own, so
 * building it first would have meant inventing the aggregates twice.
 *
 * <p>Ordered by urgency rather than by entity. What is on fire comes first,
 * then what departs soon, then the general numbers — the reverse of how the
 * data model is organised, and the right order for someone opening the app at
 * nine in the morning.
 */
export function DashboardPage() {
  const { base } = useWorkspace();
  const user = useCurrentUser();

  const summary = useMockQuery(() => dashboardSummary());
  const departures = useMockQuery(() => upcomingDepartures());
  const activity = useMockQuery(() => recentActivity());
  const overdue = useMockQuery(() =>
    listInvoices().filter((invoice) => invoice.status === 'OVERDUE'),
  );

  const attention = [
    summary.overdueInvoices > 0
      ? {
          key: 'overdue',
          label: t('payments.overdueCount', { count: summary.overdueInvoices }),
          detail: formatMoney(overdue.reduce((sum, invoice) => sum + invoice.balanceDue, 0)),
          href: `${base}/payments`,
        }
      : null,
    summary.pendingDocuments > 0
      ? {
          key: 'documents',
          label: t('documents.pendingReview'),
          detail: String(summary.pendingDocuments),
          href: `${base}/documents`,
        }
      : null,
    departures.some((group) => group.readinessIssues.length > 0)
      ? {
          key: 'readiness',
          label: t('groups.notReady'),
          detail: String(departures.filter((group) => group.readinessIssues.length > 0).length),
          href: `${base}/groups`,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.greeting', { name: user.fullName.split(' ')[0] })}
        description={t('dashboard.subtitle')}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.activePilgrims')}
          value={summary.activePilgrims}
          icon={UsersIcon}
          href={`${base}/pilgrims`}
        />
        <StatCard
          label={t('dashboard.upcomingDepartures')}
          value={summary.upcomingDepartures}
          icon={PlaneTakeoffIcon}
          href={`${base}/groups`}
        />
        <StatCard
          label={t('dashboard.revenueThisMonth')}
          value={formatMoney(summary.revenueThisMonth)}
          icon={BanknoteIcon}
          href={`${base}/payments`}
        />
        <StatCard
          label={t('dashboard.outstandingBalance')}
          value={formatMoney(summary.outstandingBalance)}
          icon={AlertTriangleIcon}
          href={`${base}/payments`}
          tone={summary.outstandingBalance > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Needs attention */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.needsAttention')}</CardTitle>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2Icon
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                {t('dashboard.allClear')}
              </div>
            ) : (
              <ul className="space-y-1">
                {attention.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <AlertTriangleIcon
                          className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                          aria-hidden
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{item.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Next departures */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.nextDepartures')}</CardTitle>
          </CardHeader>
          <CardContent>
            {departures.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noDepartures')}</p>
            ) : (
              <ul className="space-y-3">
                {departures.map((group) => {
                  const days = daysUntil(group.departureDate);
                  const filled =
                    group.capacity > 0
                      ? Math.min(Math.round((group.pilgrimCount / group.capacity) * 100), 100)
                      : 0;

                  return (
                    <li key={group.id}>
                      <Link
                        href={`${base}/groups/${group.id}`}
                        className="block rounded-md p-2 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{group.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatDateRange(group.departureDate, group.returnDate)}
                            </p>
                          </div>
                          <span
                            className={
                              days <= 14
                                ? 'shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400'
                                : 'shrink-0 text-xs text-muted-foreground'
                            }
                          >
                            {days === 0
                              ? t('dashboard.departsToday')
                              : t('dashboard.daysAway', { count: days })}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={filled} className="flex-1" />
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {t('groups.membersOf', {
                              count: group.pilgrimCount,
                              capacity: group.capacity,
                            })}
                          </span>
                        </div>

                        {group.readinessIssues.length > 0 ? (
                          <p className="mt-1.5 truncate text-xs text-amber-600 dark:text-amber-400">
                            {group.readinessIssues.join(' · ')}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overdue invoices */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.overdueInvoices')}</CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.allClear')}</p>
            ) : (
              <ul className="space-y-1">
                {overdue.slice(0, 5).map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={
                        invoice.booking ? `${base}/bookings/${invoice.booking.id}` : `${base}/payments`
                      }
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">{invoice.pilgrim?.fullName ?? '—'}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {invoice.number}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-red-600 dark:text-red-400">
                        {formatMoney(invoice.balanceDue, invoice.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noActivity')}</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    <div className="min-w-0 flex-1">
                      {entry.href ? (
                        <Link
                          href={`${base}${entry.href}`}
                          className="text-sm hover:underline hover:underline-offset-4"
                        >
                          {entry.summary}
                        </Link>
                      ) : (
                        <p className="text-sm">{entry.summary}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {entry.actorName} · {formatRelative(entry.createdAt.slice(0, 10))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
