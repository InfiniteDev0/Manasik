'use client';

import type * as React from 'react';

import { InitialsAvatar, TwoLineCell } from '@/components/data-table';
import { cn } from '@/lib/utils';

import { serviceLabel, type ServiceType } from './finance-data';

const PILL_TONES = {
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blue: 'bg-ocean-blue/15 text-ocean-blue',
  green: 'bg-ocean-green/10 text-ocean-green',
  muted: 'bg-muted text-muted-foreground',
};

/** A small coloured status label: Open, Invoiced, Unpaid, Paid… */
export function StatusPill({ tone, children }: { tone: keyof typeof PILL_TONES; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium', PILL_TONES[tone])}>
      {children}
    </span>
  );
}

/** Avatar, name, and phone underneath. */
export function ClientCell({ client, phone }: { client: string; phone: string }) {
  return (
    <div className="flex items-center gap-3">
      <InitialsAvatar name={client} />
      <TwoLineCell primary={client || 'Unnamed'} secondary={phone || 'No phone'} />
    </div>
  );
}

/** The service, with its details underneath. */
export function ServiceCell({ service, description }: { service: ServiceType; description: string }) {
  return <TwoLineCell primary={serviceLabel(service)} secondary={description || 'No details'} />;
}

/** A document number (QT-0001, INV-0001, RC-0001) in the table. */
export function DocNumber({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground font-mono text-[13px] font-medium tracking-wide">{children}</span>;
}
