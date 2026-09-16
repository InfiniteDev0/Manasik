'use client';

import type { PilgrimDocument } from '@manasik/types';
import { AlertTriangleIcon, CheckIcon, UploadIcon, XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/workspace/status-badge';
import { formatDate } from '@/lib/dates';
import { enumLabel, t } from '@/lib/strings';
import { documentChecklist } from '@/mocks/queries';
import { reviewDocument, uploadDocument, useMockQuery } from '@/mocks/store';

interface DocumentChecklistProps {
  pilgrimId: string;
  /** Return date of the pilgrim's trip — expiry is judged against it. */
  returnDate?: string | null;
}

/**
 * Per-pilgrim document checklist with upload and review actions.
 *
 * <p>Shared between the pilgrim detail page and the documents page: keeping
 * two versions in step is a losing game, and the review action in particular
 * must behave identically wherever it is invoked.
 */
export function DocumentChecklist({ pilgrimId, returnDate }: DocumentChecklistProps) {
  const documents = useMockQuery(() => documentChecklist(pilgrimId));

  const [uploadFor, setUploadFor] = React.useState<PilgrimDocument | null>(null);
  const [rejectFor, setRejectFor] = React.useState<PilgrimDocument | null>(null);

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {documents.map((doc) => {
          const expiresBeforeReturn =
            doc.expiryDate !== null && returnDate != null && doc.expiryDate < returnDate;

          return (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{enumLabel(doc.type)}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {doc.uploadedAt ? (
                    <span>
                      {t('documents.uploadedAt')} {formatDate(doc.uploadedAt.slice(0, 10))}
                    </span>
                  ) : null}
                  {doc.expiryDate ? (
                    <span className={expiresBeforeReturn ? 'text-red-600 dark:text-red-400' : ''}>
                      {t('documents.expiryDate')} {formatDate(doc.expiryDate)}
                    </span>
                  ) : null}
                  {doc.note ? <span className="italic">{doc.note}</span> : null}
                </div>
              </div>

              {expiresBeforeReturn ? (
                <span
                  className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                  title={t('documents.expiringSoon')}
                >
                  <AlertTriangleIcon className="size-3.5" aria-hidden />
                  {t('documents.expiringSoon')}
                </span>
              ) : null}

              <StatusBadge status={doc.status} />

              <div className="flex items-center gap-1">
                {/* Review is only meaningful once something has been uploaded. */}
                {doc.status === 'UPLOADED' || doc.status === 'UNDER_REVIEW' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => reviewDocument(doc.id, 'APPROVED')}
                    >
                      <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="sr-only sm:not-sr-only">{t('documents.approve')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setRejectFor(doc)}
                    >
                      <XIcon className="size-3.5 text-destructive" />
                      <span className="sr-only sm:not-sr-only">{t('documents.reject')}</span>
                    </Button>
                  </>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setUploadFor(doc)}
                >
                  <UploadIcon className="size-3.5" />
                  <span className="sr-only sm:not-sr-only">
                    {doc.status === 'MISSING' ? t('documents.upload') : 'Replace'}
                  </span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <UploadDialog
        pilgrimId={pilgrimId}
        document={uploadFor}
        onClose={() => setUploadFor(null)}
      />
      <RejectDialog document={rejectFor} onClose={() => setRejectFor(null)} />
    </>
  );
}

/**
 * Upload dialog.
 *
 * <p>No real file handling — there is no storage bucket yet. The dialog
 * captures the metadata that actually drives the workflow (type, expiry) and
 * records a placeholder file reference; wiring a real upload later replaces
 * only the store call.
 */
function UploadDialog({
  pilgrimId,
  document,
  onClose,
}: {
  pilgrimId: string;
  document: PilgrimDocument | null;
  onClose: () => void;
}) {
  const [expiryDate, setExpiryDate] = React.useState('');

  React.useEffect(() => {
    setExpiryDate(document?.expiryDate ?? '');
  }, [document]);

  return (
    <Dialog open={document !== null} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('documents.upload')}</DialogTitle>
          <DialogDescription>
            {document ? enumLabel(document.type) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 text-xs font-medium">File</Label>
            <Input type="file" disabled />
            <p className="mt-1 text-xs text-muted-foreground">
              File storage is not connected yet — the record is created without one.
            </p>
          </div>

          <div>
            <Label className="mb-1.5 text-xs font-medium">{t('documents.expiryDate')}</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (!document) return;
              uploadDocument({
                pilgrimId,
                type: document.type,
                expiryDate: expiryDate || null,
                note: '',
              });
              onClose();
            }}
          >
            {t('documents.upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Rejection always carries a reason — "rejected" with no cause is a dead end for staff. */
function RejectDialog({
  document,
  onClose,
}: {
  document: PilgrimDocument | null;
  onClose: () => void;
}) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (document) setReason('');
  }, [document]);

  return (
    <Dialog open={document !== null} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('documents.reject')}</DialogTitle>
          <DialogDescription>{document ? enumLabel(document.type) : ''}</DialogDescription>
        </DialogHeader>

        <div>
          <Label className="mb-1.5 text-xs font-medium">{t('documents.rejectionReason')}</Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Photo background is not white."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length === 0}
            onClick={() => {
              if (!document) return;
              reviewDocument(document.id, 'REJECTED', reason.trim());
              onClose();
            }}
          >
            {t('documents.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
