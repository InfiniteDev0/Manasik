'use client';

import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';

import { useTheme } from '@/features/theme/use-theme';

/**
 * App-wide toasts (goey-toast, built on Sonner).
 *
 * <p>Mounted once in the root layout, so a toast fired on /auth keeps playing
 * after navigating to /workspace. Lives in its own module because goey-toast
 * ships without a "use client" directive and the root layout is a Server
 * Component.
 *
 * <p>Use `gooeyToast` from 'goey-toast' everywhere — not Sonner's `toast`.
 */
export function Toaster() {
  // Follows the app's theme, including "system".
  const { resolvedTheme } = useTheme();
  return <GooeyToaster position="top-center" theme={resolvedTheme} />;
}
