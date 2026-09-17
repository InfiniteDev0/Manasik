import {
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  PlaneIcon,
  PlaneLandingIcon,
  PlaneTakeoffIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

import { WORKSPACE_PATH } from '@/features/workspace/navigation';

/*
 * Placeholder figures for the dashboard UI, taken from the old dashboard.
 * Nothing here is real — it gets replaced by queries once the tables exist.
 */

/** Colour of the badge and the number. Neutral uses an outline badge. */
export type StatTone = 'neutral' | 'blue' | 'violet' | 'sky' | 'green' | 'orange' | 'teal';

export interface DashboardStat {
  id: string;
  /** Short name in the pill at the top. */
  badge: string;
  icon: LucideIcon;
  /** Already formatted for display. */
  value: string;
  /** One line under the number explaining it. */
  caption: string;
  tone: StatTone;
  /** Small button in the top-right corner. */
  action?: { label: string; href: string };
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const count = (value: number) => value.toLocaleString('en-US');

/** Two rows of four on wide screens: clients & travel, then money & airlines. */
export const DASHBOARD_STATS: DashboardStat[] = [
  // ── Clients & travel ──────────────────────────────────────────────────────
  { id: 'customers', badge: 'Customers', icon: UsersIcon, value: count(6729), caption: 'On your client list', tone: 'neutral' },
  { id: 'departures-today', badge: 'Today departures', icon: PlaneTakeoffIcon, value: count(1), caption: 'Flying out today', tone: 'blue' },
  { id: 'departures-tomorrow', badge: 'Tomorrow departures', icon: PlaneTakeoffIcon, value: count(0), caption: 'Flying out tomorrow', tone: 'violet' },
  { id: 'arrivals-tomorrow', badge: 'Tomorrow arrivals', icon: PlaneLandingIcon, value: count(0), caption: 'Landing tomorrow', tone: 'sky' },

  // ── Money & airlines ──────────────────────────────────────────────────────
  {
    id: 'income-today',
    badge: 'Today income',
    icon: BanknoteArrowDownIcon,
    value: money(0),
    caption: 'Received today',
    tone: 'green',
    action: { label: 'Finance', href: `${WORKSPACE_PATH}/finance/receipts` },
  },
  { id: 'expenses-today', badge: 'Today expenses', icon: BanknoteArrowUpIcon, value: money(0), caption: 'Paid out today', tone: 'orange' },
  {
    id: 'profit-daily',
    badge: 'Daily profit',
    icon: TrendingUpIcon,
    value: money(0),
    caption: 'Income minus expenses today',
    tone: 'teal',
    action: { label: 'Reports', href: `${WORKSPACE_PATH}/reports/payments` },
  },
  {
    id: 'airlines',
    badge: 'Airlines',
    icon: PlaneIcon,
    value: count(62),
    caption: 'Airlines you book with',
    tone: 'neutral',
    action: { label: 'Tickets', href: `${WORKSPACE_PATH}/tickets` },
  },
];
