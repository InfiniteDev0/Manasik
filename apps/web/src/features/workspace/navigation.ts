export const WORKSPACE_PATH = '/workspace';

export interface NavLink {
  title: string;
  href: string;
}

/**
 * A top-level sidebar entry: either a link, or a group that expands to links.
 * `icon` is an image path in /public, used as a mask (lib/mask.ts): only its
 * shape matters, colour comes from state.
 */
export type NavItem =
  | { title: string; icon: string; href: string; items?: undefined }
  | { title: string; icon: string; items: NavLink[]; href?: undefined };

/** Sidebar navigation, in order. Every page here exists (blank for now). */
export const NAV_MAIN: NavItem[] = [
  { title: 'Dashboard', icon: '/home.svg', href: WORKSPACE_PATH },
  { title: 'Tickets', icon: '/ticket.svg', href: `${WORKSPACE_PATH}/tickets` },
  { title: 'Visas', icon: '/passport.svg', href: `${WORKSPACE_PATH}/visas` },
  { title: 'Services', icon: '/services.svg', href: `${WORKSPACE_PATH}/services` },
  {
    title: 'Finance',
    icon: '/finance.svg',
    items: [
      { title: 'Quotations', href: `${WORKSPACE_PATH}/finance/quotations` },
      { title: 'Invoices', href: `${WORKSPACE_PATH}/finance/invoices` },
      { title: 'Receipts', href: `${WORKSPACE_PATH}/finance/receipts` },
      { title: 'Expenses', href: `${WORKSPACE_PATH}/finance/expenses` },
    ],
  },
  {
    title: 'Reports',
    icon: '/reports.svg',
    items: [
      { title: 'Payment Report', href: `${WORKSPACE_PATH}/reports/payments` },
      { title: 'Outstanding Debt', href: `${WORKSPACE_PATH}/reports/outstanding-debt` },
    ],
  },
];

/** Also in the user menu at the bottom of the sidebar. */
export const SETTINGS_LINK: NavLink = { title: 'Settings', href: `${WORKSPACE_PATH}/settings` };

/** Pinned to the bottom of the sidebar, just above the user. */
export const NAV_BOTTOM: NavItem[] = [{ title: SETTINGS_LINK.title, icon: '/settings.svg', href: SETTINGS_LINK.href }];

/** Dashboard only matches exactly; everything else also matches its sub-pages. */
export function isActivePath(pathname: string, href: string): boolean {
  return href === WORKSPACE_PATH
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

const ALL_LINKS: NavLink[] = [
  ...NAV_MAIN.flatMap((item) => (item.items ? item.items : [item])),
  SETTINGS_LINK,
];

/** The header title for the current page. */
export function pageTitle(pathname: string): string {
  const match = ALL_LINKS.filter((link) => isActivePath(pathname, link.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.title ?? 'Dashboard';
}
