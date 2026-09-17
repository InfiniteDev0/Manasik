import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { DashboardStat, StatTone } from './mock-data';

/** Badge and number colours per tone, light and dark. Neutral keeps the outline badge. */
const TONES: Record<StatTone, { badge: string; value: string }> = {
  neutral: { badge: '', value: 'text-neutral-950 dark:text-neutral-50' },
  blue: { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', value: 'text-blue-600 dark:text-blue-400' },
  violet: { badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300', value: 'text-violet-600 dark:text-violet-400' },
  sky: { badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300', value: 'text-sky-600 dark:text-sky-400' },
  green: { badge: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300', value: 'text-green-600 dark:text-green-400' },
  orange: { badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300', value: 'text-orange-600 dark:text-orange-400' },
  teal: { badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300', value: 'text-teal-600 dark:text-teal-400' },
};

/**
 * A simple figure card: a coloured badge (and an optional small action) at the
 * top, the number and a one-line caption at the bottom.
 */
export function StatCard({ badge, icon: Icon, value, caption, tone, action }: DashboardStat) {
  const colours = TONES[tone];

  return (
    <div className="flex h-28 flex-col justify-between rounded-xl bg-white p-3 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant={tone === 'neutral' ? 'outline' : 'default'}
          className={cn('h-7 gap-2 text-[15px]', colours.badge)}
        >
          <Icon />
          {badge}
        </Badge>
        {action ? (
          <Button
            nativeButton={false}
            render={<Link href={action.href} />}
            className="h-6 rounded-sm px-2 text-xs"
          >
            {action.label}
          </Button>
        ) : null}
      </div>

      <div>
        <p className={cn('text-3xl leading-none font-semibold tabular-nums', colours.value)}>
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}
