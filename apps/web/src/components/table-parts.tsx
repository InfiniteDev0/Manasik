'use client';

import { CornerDownRightIcon, DownloadIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// The pieces every workspace table is built from: its page header, the category
// tabs on the card, the search box and the bar of actions for ticked rows.

// ─── Page header ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  description: string;
  onExport: () => void;
  /** Leave out for tables whose rows come from somewhere else (invoices, receipts). */
  addLabel?: string;
  onAdd?: () => void;
  /** Whether the add panel above the table is open. */
  adding?: boolean;
}

export function SectionHeader({ title, description, onExport, addLabel, onAdd, adding }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" onClick={onExport}>
          <DownloadIcon />
          Export
        </Button>
        {onAdd ? (
          <Button size="lg" onClick={onAdd} aria-expanded={adding}>
            <PlusIcon />
            {addLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Slide-down panel ────────────────────────────────────────────────────────

/** Opens and closes by sliding, pushing whatever is below it down (the add form, the selection bar). */
export function SlideDown({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export interface TableTab {
  id: string;
  label: string;
}

interface TableTabsProps {
  tabs: TableTab[];
  value: string;
  onValueChange: (id: string) => void;
  /** Rows per tab id. */
  counts: Record<string, number>;
  label: string;
}

/**
 * Rounded, browser-style tabs across the top of a table card — one per
 * category. The active tab opens into the card below it.
 */
export function TableTabs({ tabs, value, onValueChange, counts, label }: TableTabsProps) {
  return (
    <div role="tablist" aria-label={label} className="bg-muted/50 flex items-end gap-1 border-b px-2 pt-2">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              // -mb-px lays the tab over the strip's bottom border, so the active
              // one (bottom border in the card colour) joins the card seamlessly.
              'relative -mb-px flex h-10 shrink-0 items-center gap-2 rounded-t-xl border px-4 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
              active
                ? 'bg-card text-foreground border-border border-b-card font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
            )}
          >
            {tab.label}
            <span className="bg-muted text-muted-foreground rounded-md border px-1.5 text-xs leading-5 font-normal tabular-nums">
              {counts[tab.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

interface TableSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder: string;
  label: string;
}

/** Filters the rows as you type. Esc clears it. */
export function TableSearch({ value, onChange, placeholder, label }: TableSearchProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onChange('');
        }}
        className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 h-9 w-full rounded-lg border pe-9 ps-9 text-sm shadow-xs outline-none transition-colors focus-visible:ring-3 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// ─── Selection bar ───────────────────────────────────────────────────────────

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

interface SelectionBarProps {
  count: number;
  /** Only offered when exactly one row is selected. */
  onEdit?: () => void;
  onExport: () => void;
  /** Leave out where rows mustn't be deleted (invoices, receipts). */
  onDelete?: () => void;
  onClear: () => void;
}

/** "↳ 2 rows selected" and the bulk actions, shown between the toolbar and the table. */
export function SelectionBar({ count, onEdit, onExport, onDelete, onClear }: SelectionBarProps) {
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
      {onDelete ? (
        <SelectionAction
          label="Delete selected"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon />
        </SelectionAction>
      ) : null}
      <SelectionAction label="Clear selection" onClick={onClear}>
        <XIcon />
      </SelectionAction>
    </div>
  );
}
