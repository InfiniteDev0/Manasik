import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary action(s) — rendered right-aligned on desktop, below on mobile. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The header every workspace page starts with.
 *
 * <p>Exists so the eight pages cannot drift into eight different title sizes
 * and spacings. Any page needing something structurally different should say
 * so here rather than hand-rolling its own.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
