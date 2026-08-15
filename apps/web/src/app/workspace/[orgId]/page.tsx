'use client';

import { use } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

export default function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const user = useAuthStore((state) => state.user);
  const memberships = useAuthStore((state) => state.memberships);

  const workspace = memberships.find((m) => m.organizationId === orgId);

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome, {user?.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workspace?.organizationName} · you are the {workspace?.role.toLowerCase()}
        </p>
      </div>

      {/* Placeholders for the metric cards in the product spec: today's
          departures, pilgrims travelling, revenue this month, pending visas. */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>

      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50" />
    </>
  );
}
