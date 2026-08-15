import {
  BuildingIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  PackageIcon,
  PlaneIcon,
  Settings2Icon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@manasik/types';

export interface WorkspaceNavItem {
  title: string;
  /** URL segment appended to /workspace/{orgId}. Empty string = the home page. */
  segment: string;
  icon: LucideIcon;
  /**
   * Permission required to see this entry.
   *
   * <p>Hiding a link is presentation, not access control — the API enforces the
   * real rule on every request. This exists so a GUIDE isn't shown a Payments
   * page that would only 403 them.
   */
  permission?: Permission;
}

/** Sidebar entries, in order. From the product spec in docs/manasik.md. */
export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
  { title: 'Dashboard', segment: '', icon: LayoutDashboardIcon },
  { title: 'Pilgrims', segment: 'pilgrims', icon: UsersIcon, permission: 'PILGRIM_VIEW' },
  { title: 'Packages', segment: 'packages', icon: PackageIcon, permission: 'PACKAGE_VIEW' },
  { title: 'Bookings', segment: 'bookings', icon: ListChecksIcon, permission: 'BOOKING_VIEW' },
  { title: 'Groups', segment: 'groups', icon: UsersRoundIcon, permission: 'GROUP_VIEW' },
  { title: 'Hotels', segment: 'hotels', icon: BuildingIcon, permission: 'HOTEL_VIEW' },
  { title: 'Transport', segment: 'transport', icon: PlaneIcon, permission: 'TRANSPORT_VIEW' },
  { title: 'Payments', segment: 'payments', icon: CreditCardIcon, permission: 'PAYMENT_VIEW' },
  { title: 'Documents', segment: 'documents', icon: FileTextIcon, permission: 'DOCUMENT_VIEW' },
  { title: 'Calendar', segment: 'calendar', icon: CalendarDaysIcon },
  { title: 'Staff', segment: 'staff', icon: UsersRoundIcon, permission: 'MEMBER_VIEW' },
  { title: 'Settings', segment: 'settings', icon: Settings2Icon },
];

export function navItemUrl(base: string, item: Pick<WorkspaceNavItem, 'segment'>): string {
  return item.segment ? `${base}/${item.segment}` : base;
}

export function workspaceBase(organizationId: string): string {
  return `/workspace/${organizationId}`;
}
