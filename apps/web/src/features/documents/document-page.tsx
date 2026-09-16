'use client';

import type { PilgrimDocument } from '@manasik/types';
import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import * as React from 'react';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/workspace/empty-state';
import { PageHeader } from '@/components/workspace/page-header';
import { StatCard } from '@/components/workspace/stat-card';
import { PilgrimAvatar } from '@/features/pilgrims/pilgrim-avatar';
import { enumLabel, statusLabel, t } from '@/lib/strings';
import { cn } from '@/lib/utils';
import {
  REQUIRED_DOCUMENTS,
  documentChecklist,
  listDocuments,
  listPilgrims,
} from '@/mocks/queries';
import { useMockQuery } from '@/mocks/store';

import { DocumentChecklist } from './document-checklist';

/**
 * Documents as a per-pilgrim matrix.
 *
 * <p>A flat list of document rows answers "what documents exist", which nobody
 * asks. The operational question is "who is missing what", and that needs one
 * row per pilgrim with a cell per required type — the gaps then read as holes
 * in a grid rather than as absent rows.
 */
export function DocumentPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('__all__');
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const pilgrims = useMockQuery(listPilgrims);
  const documents = useMockQuery(listDocuments);

  const pendingReview = documents.filter(
    (doc) => doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW',
  ).length;
  const rejected = documents.filter((doc) => doc.status === 'REJECTED').length;

  const rows = useMockQuery(() =>
    listPilgrims().map((pilgrim) => ({
      pilgrim,
      checklist: documentChecklist(pilgrim.id),
    })),
  );

  const visible = rows.filter((row) => {
    if (search && !row.pilgrim.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter === '__all__') return true;
    // Filtering by status keeps a pilgrim when ANY of their documents match —
    // the user is looking for people to chase, not for individual files.
    return row.checklist.some((doc) => doc.status === statusFilter);
  });

  const missingAnything = rows.filter((row) =>
    row.checklist.some((doc) => doc.status !== 'APPROVED'),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t('documents.title')} description={t('documents.subtitle')} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('documents.pendingReview')}
          value={pendingReview}
          icon={FileTextIcon}
          tone={pendingReview > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label={statusLabel('REJECTED')}
          value={rejected}
          tone={rejected > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Pilgrims with gaps" value={`${missingAnything} / ${rows.length}`} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`${t('common.search')} ${t('pilgrims.title').toLowerCase()}…`}
          className="h-8 w-full sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(value: unknown) => setStatusFilter(String(value))}
        >
          <SelectTrigger size="sm" className="h-8 w-full sm:w-auto sm:min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('common.status')}</SelectItem>
            {(['MISSING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'] as const).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status)}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {pilgrims.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title={t('documents.empty')}
          description={t('documents.emptyHint')}
        />
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">
                    {t('documents.pilgrim')}
                  </th>
                  {REQUIRED_DOCUMENTS.map((type) => (
                    <th
                      key={type}
                      className="px-2 py-2.5 text-center text-xs font-medium whitespace-nowrap"
                    >
                      {enumLabel(type)}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {visible.map(({ pilgrim, checklist }) => (
                  <React.Fragment key={pilgrim.id}>
                    <tr
                      className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                      onClick={() => setExpanded(expanded === pilgrim.id ? null : pilgrim.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <PilgrimAvatar name={pilgrim.fullName} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{pilgrim.fullName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t('pilgrims.documentsProgress', {
                                approved: pilgrim.documentsApproved,
                                required: pilgrim.documentsRequired,
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {checklist.map((doc) => (
                        <td key={doc.id} className="px-2 py-2.5 text-center">
                          <DocumentDot status={doc.status} />
                        </td>
                      ))}

                      <td className="pr-3">
                        <ChevronDownIcon
                          className={cn(
                            'size-4 text-muted-foreground transition-transform',
                            expanded === pilgrim.id && 'rotate-180',
                          )}
                          aria-hidden
                        />
                      </td>
                    </tr>

                    {/* Expanding inline keeps the person's row in view while
                        working through their paperwork — a detour to their
                        page loses the queue position. */}
                    {expanded === pilgrim.id ? (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={REQUIRED_DOCUMENTS.length + 2} className="p-4">
                          <DocumentChecklist
                            pilgrimId={pilgrim.id}
                            returnDate={pilgrim.currentPackage?.returnDate ?? null}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}

                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={REQUIRED_DOCUMENTS.length + 2}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {t('common.none')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Legend />
    </div>
  );
}

const DOT_CLASSES: Record<PilgrimDocument['status'], string> = {
  MISSING: 'bg-muted ring-1 ring-border',
  UPLOADED: 'bg-blue-500',
  UNDER_REVIEW: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-red-500',
  // Hollow rather than solid: it was valid once, which is a different
  // problem from never having been accepted.
  EXPIRED: 'bg-transparent ring-2 ring-red-500',
};

/**
 * One cell in the matrix.
 *
 * <p>A dot rather than a badge: six badges per row across six columns is a
 * wall of text. The title attribute carries the label for anyone who needs it,
 * and the legend below the table covers the rest.
 */
function DocumentDot({ status }: { status: PilgrimDocument['status'] }) {
  return (
    <span
      className={cn('inline-block size-2.5 rounded-full', DOT_CLASSES[status])}
      title={statusLabel(status)}
      role="img"
      aria-label={statusLabel(status)}
    />
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {(Object.keys(DOT_CLASSES) as PilgrimDocument['status'][]).map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={cn('inline-block size-2.5 rounded-full', DOT_CLASSES[status])} />
          {statusLabel(status)}
        </span>
      ))}
    </div>
  );
}
