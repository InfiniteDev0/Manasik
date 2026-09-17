'use client';

import { CornerDownRightIcon, DownloadIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import type * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SelectionActionProps {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

/** Icon-only action with its name in a tooltip. */
function SelectionAction({ label, onClick, className, children }: SelectionActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={onClick}
            className={cn('text-muted-foreground hover:text-foreground', className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface TicketsSelectionBarProps {
  count: number;
  /** Only offered when exactly one ticket is selected. */
  onEdit?: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/** "↳ 2 rows selected" and the bulk actions, shown between the toolbar and the table. */
export function TicketsSelectionBar({ count, onEdit, onExport, onDelete, onClear }: TicketsSelectionBarProps) {
  return (
    <div className="flex h-11 items-center gap-1 border-t px-3">
      <CornerDownRightIcon className="text-muted-foreground size-4" />
      <span className="text-muted-foreground ms-2 me-3 text-sm">
        <span className="text-foreground font-medium tabular-nums">{count}</span>{' '}
        {count === 1 ? 'row' : 'rows'} selected
      </span>

      {onEdit ? (
        <SelectionAction label="Edit" onClick={onEdit}>
          <PencilIcon />
        </SelectionAction>
      ) : null}
      <SelectionAction label="Export selected" onClick={onExport}>
        <DownloadIcon />
      </SelectionAction>
      <SelectionAction
        label="Delete selected"
        onClick={onDelete}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2Icon />
      </SelectionAction>
      <SelectionAction label="Clear selection" onClick={onClear}>
        <XIcon />
      </SelectionAction>
    </div>
  );
}
