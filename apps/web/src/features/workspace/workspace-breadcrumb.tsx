'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { WORKSPACE_BASE, WORKSPACE_NAV_ITEMS, navItemUrl } from './nav-items';

// The home entry names the root crumb, so the two can't drift apart.
const HOME_TITLE = WORKSPACE_NAV_ITEMS.find((item) => !item.segment)?.title ?? 'Dashboard';

export function WorkspaceBreadcrumb() {
  const pathname = usePathname();
  const base = WORKSPACE_BASE;

  // Longest segment first, so /pilgrims/new resolves to Pilgrims rather than
  // whichever entry happens to be declared earliest.
  const active = [...WORKSPACE_NAV_ITEMS]
    .filter((item) => item.segment)
    .sort((a, b) => b.segment.length - a.segment.length)
    .find((item) => pathname.startsWith(navItemUrl(base, item)));

  const isHome = !active;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isHome ? (
            <BreadcrumbPage className="text-sm font-medium">{HOME_TITLE}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href={base}>{HOME_TITLE}</Link>} />
          )}
        </BreadcrumbItem>

        {active && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium">{active.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
