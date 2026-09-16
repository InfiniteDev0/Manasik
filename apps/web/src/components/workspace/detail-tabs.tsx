'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface DetailTab {
  value: string;
  label: string;
  /** Small count next to the label — documents, members, payments. */
  count?: number;
  content: ReactNode;
}

interface DetailTabsProps {
  tabs: DetailTab[];
  /** Query parameter the active tab is stored in. */
  param?: string;
  className?: string;
}

/**
 * Tabs for a detail page, with the active tab kept in the URL.
 *
 * <p>Local state would be simpler, but then a refresh or a shared link always
 * lands on the first tab — which on these pages is "Overview" when the person
 * meant to send someone to "Documents". `replace` rather than `push` so the
 * back button leaves the detail page instead of walking back through tabs.
 */
export function DetailTabs({ tabs, param = 'tab', className }: DetailTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requested = searchParams.get(param);
  const active = tabs.some((tab) => tab.value === requested) ? requested! : tabs[0]?.value;

  function selectTab(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(param, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <Tabs
      value={active}
      onValueChange={(value) => selectTab(String(value))}
      className={cn('gap-4', className)}
    >
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-none">
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">
                {tab.count}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
