'use client';

import type { ReactNode } from 'react';
import { useWorkspaceStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import BottomPill from './BottomPill';
import TopBar from './TopBar';
import HomeSidebar from '../sidebars/HomeSidebar';
import InboxSidebar from '@/components/workspace/inbox-sidebar';
import LibrarySidebar from '@/components/workspace/library-sidebar';
import CalendarSidebar from '@/components/workspace/calendar-sidebar';

interface WorkspaceShellProps {
  workspaceSlug: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function WorkspaceShell({
  workspaceSlug,
  children,
  isLoading = false,
}: WorkspaceShellProps) {
  const sidebarCollapsed = useWorkspaceStore((s) => s.sidebarCollapsed);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar — fixed height 52px */}
      <div className="flex-shrink-0 bg-background">
        {isLoading ? <TopBarSkeleton /> : <TopBar workspaceSlug={workspaceSlug} />}
      </div>

      {/* Body — sidebar + main */}
      <div className="flex flex-1 min-h-0 overflow-hidden gap-1 p-1">
        {/* Sidebar */}
        <div
          className={cn(
            'flex-shrink-0 transition-all duration-200 overflow-hidden  rounded-xl bg-muted-foreground/10',
            sidebarCollapsed ? 'w-0' : 'w-70'
          )}
        >
          {isLoading ? <SidebarSkeleton /> : <SidebarSlot workspaceSlug={workspaceSlug} />}
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto pb-24 rounded-xl bg-muted-foreground/10 custom-scrollbar">
          {isLoading ? <MainSkeleton /> : children}
        </main>
      </div>

      {/* Bottom pill — floating */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <BottomPill workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
}

/* ─── Sidebar slot ─── */

function SidebarSlot({ workspaceSlug: _ }: { workspaceSlug: string }) {
  const activeSection = useWorkspaceStore((s) => s.activeSection);

  switch (activeSection) {
    case 'home':
      return <HomeSidebar/>
    case 'inbox':
      return  <InboxSidebar/>
    case 'library':
      return <LibrarySidebar/>
    case 'calendar':
      return (
       <CalendarSidebar/>
      );
    case 'docs':
      return null;
    default:
      return null;
  }
}

/* ─── Skeleton states ─── */

function TopBarSkeleton() {
  // Mirrors TopBar exactly: h-11 / px-3, the h-7.5 workspace pill, w-7 avatar.
  return (
    <div className="h-11 flex items-center justify-between px-3">
      {/* Left: workspace pill + divider + presentation icon */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-sm border border-border px-1 pr-2 h-7.5 animate-pulse">
          <div className="size-6 rounded-sm bg-muted" />
          <div className="w-24 h-3.5 bg-muted rounded" />
          <div className="w-3 h-3 bg-muted rounded-sm" />
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="w-7 h-7 bg-muted rounded animate-pulse" />
      </div>

      {/* Right: action icons + divider + avatar */}
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        <div className="w-8 h-8 bg-muted rounded animate-pulse" />
        <div className="h-4 w-px bg-border mx-2" />
        <div className="flex items-center gap-1">
          <div className="relative w-7 h-7 bg-muted rounded-full animate-pulse">
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-muted border-2 border-background" />
          </div>
          <div className="w-3.5 h-3.5 bg-muted rounded-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors HomeSidebar exactly: p-4, Add header, Pages×6 → Favorites×2 → bottom-nav×3. */
function SidebarSkeleton() {
  const SidebarRowSkeleton = ({ width }: { width: string }) => (
    // Matches SidebarRow: px-2 py-1.5, 16px icon in an h-5 w-5 box.
    <div className="flex items-center gap-3 px-2 py-1.5">
      <div className="h-5 w-5 bg-muted rounded animate-pulse shrink-0" />
      <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width }} />
    </div>
  );

  const SectionLabel = ({ width }: { width: string }) => (
    <div className="px-2 py-1.5">
      <div className={`${width} h-3 bg-muted rounded animate-pulse`} />
    </div>
  );

  return (
    <div className="p-4 flex flex-col">
      {/* Header (Add): "Home" + split add button, then the divider */}
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="w-14 h-4 bg-muted rounded animate-pulse" />
        <div className="w-12 h-6 bg-muted rounded-sm animate-pulse" />
      </div>
      <div className="h-px bg-border -mx-4 mb-2" />

      {/* Pages section */}
      <div className="flex flex-col gap-0.5 mb-3">
        <SectionLabel width="w-12" />
        {['58%', '70%', '48%', '62%', '54%', '66%'].map((w, i) => (
          <SidebarRowSkeleton key={i} width={w} />
        ))}
      </div>

      {/* Favorites section */}
      <div className="flex flex-col gap-0.5 mb-3">
        <SectionLabel width="w-16" />
        {['52%', '64%'].map((w, i) => (
          <SidebarRowSkeleton key={i} width={w} />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex flex-col gap-0.5">
        {['44%', '56%', '40%'].map((w, i) => (
          <SidebarRowSkeleton key={i} width={w} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors the workspace home page: icon + title + subtitle, then a centered empty state. */
function MainSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-8 pt-10 flex flex-col gap-4">
        <div className="w-16 h-16 bg-muted rounded-2xl animate-pulse" />
        <div className="w-56 h-10 bg-muted rounded-lg animate-pulse" />
        <div className="w-20 h-4 bg-muted rounded animate-pulse" />
      </div>

      {/* Centered empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-xl animate-pulse" />
        <div className="w-48 h-5 bg-muted rounded animate-pulse" />
        <div className="w-40 h-3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
