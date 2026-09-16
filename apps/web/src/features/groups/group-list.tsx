'use client';

import { AlertTriangleIcon, CheckCircle2Icon, PlusIcon, UsersRoundIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { StatusBadge } from '@/components/workspace/status-badge';
import { useWorkspace } from '@/features/workspace/use-workspace';
import { formatDateRange } from '@/lib/dates';
import { t } from '@/lib/strings';
import { daysUntil, listGroups, type GroupRow } from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { GroupForm } from './group-form';

/**
 * Groups as cards, not a table.
 *
 * <p>A group is a handful of facts that matter all at once — how full, how
 * soon, who is blocked. A table row forces those into columns that each get
 * scanned separately; a card shows the state of a departure in one look, and
 * there are rarely more than a dozen.
 */
export function GroupList() {
  const { base } = useWorkspace();
  const [formOpen, setFormOpen] = React.useState(false);

  const groups = useMockQuery(listGroups);

  const upcoming = groups.filter((group) => group.status !== 'COMPLETED');
  const ready = upcoming.filter((group) => group.readinessIssues.length === 0).length;
  const totalPilgrims = upcoming.reduce((sum, group) => sum + group.pilgrimCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('groups.title')}
        description={t('groups.subtitle')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="size-4" />
            {t('groups.create')}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('dashboard.upcomingDepartures')}
          value={upcoming.length}
          icon={UsersRoundIcon}
        />
        <StatCard label={t('groups.ready')} value={`${ready} / ${upcoming.length}`} />
        <StatCard label={t('groups.members')} value={totalPilgrims} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={UsersRoundIcon}
          title={t('groups.empty')}
          description={t('groups.emptyHint')}
          action={
            <Button onClick={() => setFormOpen(true)}>
              <PlusIcon className="size-4" />
              {t('groups.create')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} href={`${base}/groups/${group.id}`} />
          ))}
        </div>
      )}

      <GroupForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function GroupCard({ group, href }: { group: GroupRow; href: string }) {
  const days = daysUntil(group.departureDate);
  const filled =
    group.capacity > 0 ? Math.min(Math.round((group.pilgrimCount / group.capacity) * 100), 100) : 0;
  const isReady = group.readinessIssues.length === 0;

  return (
    <Card className="gap-0 p-0 transition-colors hover:border-foreground/20">
      <Link href={href} className="block p-5 focus-visible:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-heading font-semibold">{group.name}</h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {group.package?.name ?? '—'}
            </p>
          </div>
          <StatusBadge status={group.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{formatDateRange(group.departureDate, group.returnDate)}</span>
          {group.status !== 'COMPLETED' && days >= 0 ? (
            <span className={days <= 14 ? 'text-amber-600 dark:text-amber-400' : ''}>
              {days === 0 ? t('dashboard.departsToday') : t('dashboard.daysAway', { count: days })}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('groups.members')}</span>
            <span className="tabular-nums">
              {t('groups.membersOf', { count: group.pilgrimCount, capacity: group.capacity })}
            </span>
          </div>
          <Progress value={filled} />
        </div>

        <div className="mt-4 flex items-start gap-2 border-t pt-3 text-sm">
          {isReady ? (
            <>
              <CheckCircle2Icon
                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span className="text-muted-foreground">{t('groups.ready')}</span>
            </>
          ) : (
            <>
              <AlertTriangleIcon
                className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <ul className="min-w-0 space-y-0.5 text-muted-foreground">
                {group.readinessIssues.map((issue) => (
                  <li key={issue} className="truncate">
                    {issue}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Link>
    </Card>
  );
}
