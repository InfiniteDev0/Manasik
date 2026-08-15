'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Wall clock in the workspace header.
 *
 * <p>Starts empty and fills in after mount. Rendering the time during SSR would
 * produce different markup on the server and the client — a guaranteed
 * hydration mismatch, since the two never run at the same instant.
 */
export function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(formatter.format(new Date()));
    // Deferred off the effect body so it isn't a synchronous setState during
    // mount; still fills in immediately afterwards.
    const first = setTimeout(update, 0);
    const id = setInterval(update, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <div className={cn('hidden items-center gap-1 tabular-nums md:flex', className)}>
      <Clock className="size-4" />
      {time ?? '--:--'}
    </div>
  );
}
