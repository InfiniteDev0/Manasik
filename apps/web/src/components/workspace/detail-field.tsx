import type { ReactNode } from 'react';

import { t } from '@/lib/strings';
import { cn } from '@/lib/utils';

interface DetailFieldProps {
  label: string;
  /** Empty, null or undefined renders the "Not set" placeholder. */
  value?: ReactNode;
  className?: string;
}

/**
 * One label/value pair in a detail panel.
 *
 * <p>Renders a placeholder rather than collapsing when there is no value: a
 * field that vanishes when empty makes the panel's shape change between
 * records, and "is the passport number missing or does this view not show it?"
 * becomes an unanswerable question.
 */
export function DetailField({ label, value, className }: DetailFieldProps) {
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', isEmpty && 'text-muted-foreground/60 italic')}>
        {isEmpty ? t('common.notSet') : value}
      </dd>
    </div>
  );
}

/** Responsive grid for a run of DetailFields. */
export function DetailFieldGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </dl>
  );
}
