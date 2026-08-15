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
import { WORKSPACE_NAV_ITEMS, navItemUrl, workspaceBase } from './nav-items';

export function WorkspaceBreadcrumb({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const base = workspaceBase(orgId);

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
            <BreadcrumbPage className="text-sm font-medium">{orgName}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href={base}>{orgName}</Link>} />
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
