'use client';

import { DownloadIcon, PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface TicketsHeaderProps {
  onExport: () => void;
  onAddTicket: () => void;
  /** Whether the add-ticket panel above the table is open. */
  adding: boolean;
}

/** Page title on the left, Export and Add ticket on the right. */
export function TicketsHeader({ onExport, onAddTicket, adding }: TicketsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">Tickets</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Track the tickets you issue to clients — who is flying, where, and what was paid.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" onClick={onExport}>
          <DownloadIcon />
          Export
        </Button>
        <Button size="lg" onClick={onAddTicket} aria-expanded={adding} aria-controls="add-ticket-panel">
          <PlusIcon />
          Add ticket
        </Button>
      </div>
    </div>
  );
}
