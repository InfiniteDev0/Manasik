'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  CircleCheckBig,
  Presentation,
  SearchIcon,
  LayoutDashboard,
  ChevronDown as ChevronIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useAuthStore, useWorkspaceStore } from '@/lib/store';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import UserMenu from './UserMenu';

interface TopBarProps {
  workspaceSlug: string;
}

export default function TopBar({ workspaceSlug }: TopBarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const blackboardHref = `/workspace/${workspaceSlug}/blackboard`;
  const workspaceHref = `/workspace/${workspaceSlug}/home`;
  const onBlackboard = pathname === blackboardHref;

  return (
    <TooltipProvider delayDuration={200}>
      <nav className="bg-background px-3 flex items-center justify-between h-11 gap-2 select-none">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2">
          <WorkspaceSwitcher workspaceSlug={workspaceSlug} />
          <div className="h-4 w-[1px] bg-border mx-1" />
          {onBlackboard ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={workspaceHref}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                >
                  <LayoutDashboard size={16} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px] ml-2 px-2 py-1">
                Switch to Workspace
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={blackboardHref}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                >
                  <Presentation size={16} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px] px-2 py-1">
                Switch to Blackboard
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                <CircleCheckBig size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] px-2 py-1">
              Create
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                <SearchIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] px-2  py-1">
              Search
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-[1px] bg-border mx-2" />

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center pl-1 pr-2 py-0.5 hover:bg-none rounded-full transition-colors cursor-pointer gap-1 group">
                <div className="relative">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border text-foreground text-[10px] font-bold select-none">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <ChevronIcon
                  size={14}
                  className={`text-muted-foreground transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </PopoverTrigger>

            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="p-0 text-foreground rounded-xl bg-popover custom-scrollbar overflow-hidden"
            >
              <UserMenu workspaceSlug={workspaceSlug} />
            </PopoverContent>
          </Popover>
        </div>

        <span className="sr-only">{workspace?.name ?? ''}</span>
      </nav>
    </TooltipProvider>
  );
}
