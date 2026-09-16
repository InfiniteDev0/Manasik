'use client';

import { WORKSPACE_BASE } from './nav-items';

/**
 * The workspace URL prefix.
 *
 * <p>A constant today — there is one agency. It stays behind a hook so that
 * the day agencies come back into the URL, it is one edit here rather than a
 * hunt through every page that builds a link.
 */
export function useWorkspace() {
  return { base: WORKSPACE_BASE };
}
