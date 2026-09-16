import { Badge } from '@/components/ui/badge';
import { statusLabel } from '@/lib/strings';
import { cn } from '@/lib/utils';

/**
 * Colour families, by what the status *means* rather than by which enum it
 * came from. `CONFIRMED`, `APPROVED` and `PAID` are all "this is settled", and
 * a user scanning a table should read them the same way without translating
 * each column's private palette.
 */
type Tone = 'neutral' | 'progress' | 'success' | 'warning' | 'danger' | 'muted';

const TONE_CLASSES: Record<Tone, string> = {
  // Ring instead of a solid fill: a table of solid pills is unreadable.
  neutral: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
  progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20',
  muted: 'bg-muted text-muted-foreground ring-1 ring-border',
};

/**
 * Every status value in the domain, mapped once.
 *
 * <p>One table rather than a `tone` prop at each call site — otherwise the
 * same status ends up amber on one page and grey on another.
 */
const STATUS_TONES: Record<string, Tone> = {
  // Package
  DRAFT: 'neutral',
  ACTIVE: 'success',
  SOLD_OUT: 'warning',

  // Booking
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'muted',

  // Pilgrim
  LEAD: 'neutral',
  REGISTERED: 'progress',
  TRAVELLING: 'progress',

  // Group
  PLANNING: 'neutral',
  OPEN: 'progress',
  READY: 'success',

  // Invoice
  UNPAID: 'neutral',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',

  // Document
  MISSING: 'neutral',
  UPLOADED: 'progress',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'danger',

  // Visa
  NOT_STARTED: 'neutral',
  SUBMITTED: 'progress',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? 'neutral';

  return (
    <Badge className={cn('border-transparent font-medium', TONE_CLASSES[tone], className)}>
      {statusLabel(status)}
    </Badge>
  );
}
