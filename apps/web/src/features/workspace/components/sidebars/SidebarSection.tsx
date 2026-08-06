'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Hash,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  showPlus?: boolean;
  defaultOpen?: boolean;
}

export default function SidebarSection({
  title,
  children,
  showPlus,
  defaultOpen,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/section"
    >
      <div className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-900/40 rounded-md transition-colors cursor-default">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <button className="text-zinc-600 hover:text-white transition-all duration-200">
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${!isOpen && '-rotate-90'}`}
              />
            </button>
          </CollapsibleTrigger>
          <h3 className="text-[11px] font-Semibold tracking-widest text-zinc-500">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded">
                <MoreHorizontal size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={10}
              className="bg-background text-white border-zinc-800 w-[250px] p-1.5 shadow-2xl rounded-lg"
            >
              <div className="flex flex-col gap-0.5">
                <button className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors text-left w-full">
                  <ArrowUpDown
                    size={14}
                    className="text-zinc-400 group-hover:text-zinc-200"
                  />
                  <span className="text-[13px] font-medium text-zinc-200">
                    Sort
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[12px]">Last edited</span>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </div>
                </button>
                <button className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors text-left w-full">
                  <Hash
                    size={14}
                    className="text-zinc-400 group-hover:text-zinc-200"
                  />
                  <span className="text-[13px] font-medium text-zinc-200">
                    Show
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[12px]">10</span>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </div>
                </button>
                <button className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors text-left w-full">
                  <ArrowUp
                    size={14}
                    className="text-zinc-400 group-hover:text-zinc-200"
                  />
                  <span className="text-[13px] font-medium text-zinc-200">
                    Move up
                  </span>
                </button>
                <button className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors text-left w-full">
                  <ArrowDown
                    size={14}
                    className="text-zinc-400 group-hover:text-zinc-200"
                  />
                  <span className="text-[13px] font-medium text-zinc-200">
                    Move down
                  </span>
                </button>
                <div className="h-px bg-zinc-800/50 my-1 mx-1" />
                <button className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-zinc-800/80 transition-colors text-left w-full">
                  <EyeOff
                    size={14}
                    className="text-zinc-400 group-hover:text-zinc-200"
                  />
                  <span className="text-[13px] font-medium text-zinc-200">
                    Hide section
                  </span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
          {showPlus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded">
                    <Plus size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[10px] px-2 py-1">
                  {title === 'Files' ? 'Add file' : 'Add a page'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <CollapsibleContent className="space-y-0.5 mt-0.5 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
