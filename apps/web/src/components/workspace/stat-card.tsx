import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Small qualifier under the value — "3 overdue", "of 45 seats". */
  hint?: string;
  icon?: LucideIcon;
  /** Makes the whole card a link to the underlying list. */
  href?: string;
  /** Draws attention when the number is a problem rather than just a number. */
  tone?: 'default' | 'warning' | 'danger';
  className?: string;
}

const TONE_VALUE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

/**
 * A single number on the dashboard or a page's summary strip.
 *
 * <p>The value is the loudest thing in the card; the label sits above it small
 * and muted. Reversing that — big label, small number — is the usual mistake
 * and makes a row of these unscannable.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = 'default',
  className,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      </div>
      <p className={cn('mt-2 font-heading text-2xl font-semibold tracking-tight', TONE_VALUE[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  return (
    <Card
      className={cn(
        'gap-0 p-4',
        href && 'transition-colors hover:border-foreground/20 hover:bg-muted/40',
        className,
      )}
    >
      {href ? (
        // The link wraps the content, not the Card, so the whole surface is
        // clickable without nesting an <a> around a block-level component.
        <Link href={href} className="block focus-visible:outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
    </Card>
  );
}
