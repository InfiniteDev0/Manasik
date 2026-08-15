'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import type { SubscriptionPlan } from '@manasik/types';
import { Badge } from '@/components/ui/badge';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { workspaceBase } from './nav-items';

/** Display names. The enum values are shouty and internal. */
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  TRIAL: 'Trial',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

/**
 * Header CTA: an upgrade prompt on the free tier, a plan badge otherwise.
 *
 * <p>TRIAL is treated as "not yet paying", so it gets the prompt — that is the
 * whole point of a trial. Every other tier gets the badge.
 */
export function PlanBadge({ orgId, plan }: { orgId: string; plan: SubscriptionPlan }) {
  if (plan === 'TRIAL') {
    return (
      <RainbowButton
        asChild
        variant="outline"
        className="h-fit cursor-pointer rounded-sm p-1 px-2 text-xs"
      >
        <Link href={`${workspaceBase(orgId)}/pricing`}>
          <Crown />
          Upgrade to Pro
        </Link>
      </RainbowButton>
    );
  }

  return (
    <Badge className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
      <Crown className="size-3" />
      {PLAN_LABELS[plan]}
    </Badge>
  );
}
