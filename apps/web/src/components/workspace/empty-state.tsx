import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** The action that resolves the emptiness — "New package", "Add pilgrim". */
  action?: ReactNode;
  className?: string;
}

/**
 * Shown where a list has nothing in it.
 *
 * <p>Always carries the action that fills it. An empty table with no way
 * forward is the point at which a new user closes the app.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
