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

/** Every workspace page lives under this path. */
export const WORKSPACE_BASE = '/workspace';

export interface WorkspaceNavItem {
  title: string;
  /** URL segment appended to the workspace base. Empty string = the home page. */
  segment: string;
  icon: LucideIcon;
  /**
   * Rendered as a disabled entry with a "Soon" tag instead of a link.
   *
   * <p>Kept visible rather than removed so the product's eventual shape is
   * legible to the user — and so nobody wires up a route that leads nowhere.
   */
  comingSoon?: boolean;
}

/**
 * Sidebar entries, in order.
 *
 * <p>The first eight are the MVP scope from the workspace spec. The rest are
 * deliberately parked: the spec asks for them to be hidden or shown as coming
 * soon, and a link to an empty page is worse than an honest label.
 */
export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
  // ── MVP ────────────────────────────────────────────────────────────────────
  { title: 'Dashboard', segment: '', icon: LayoutDashboardIcon },
  { title: 'Pilgrims', segment: 'pilgrims', icon: UsersIcon },
  { title: 'Packages', segment: 'packages', icon: PackageIcon },
  { title: 'Bookings', segment: 'bookings', icon: ListChecksIcon },
  { title: 'Groups', segment: 'groups', icon: UsersRoundIcon },
  { title: 'Payments', segment: 'payments', icon: CreditCardIcon },
  { title: 'Documents', segment: 'documents', icon: FileTextIcon },
  { title: 'Settings', segment: 'settings', icon: Settings2Icon },

  // ── Parked ─────────────────────────────────────────────────────────────────
  { title: 'Hotels', segment: 'hotels', icon: BuildingIcon, comingSoon: true },
  { title: 'Transport', segment: 'transport', icon: PlaneIcon, comingSoon: true },
  { title: 'Calendar', segment: 'calendar', icon: CalendarDaysIcon, comingSoon: true },
];

/** Only the entries that are actually navigable. */
export const MVP_NAV_ITEMS = WORKSPACE_NAV_ITEMS.filter((item) => !item.comingSoon);

export function navItemUrl(base: string, item: Pick<WorkspaceNavItem, 'segment'>): string {
  return item.segment ? `${base}/${item.segment}` : base;
}
