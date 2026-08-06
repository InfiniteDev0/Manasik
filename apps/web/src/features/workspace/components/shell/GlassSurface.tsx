'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reusable liquid-glass panel — the same layered effect as the BottomPill dock,
 * tuned for popovers/menus via the `liquidGlass-panel` variant.
 *
 * Relies on the #glass-distortion SVG filter, which the BottomPill renders once
 * and is therefore available document-wide while the workspace shell is mounted.
 */
export default function GlassSurface({ children, className }: GlassSurfaceProps) {
  return (
    <div className={cn('liquidGlass-wrapper liquidGlass-panel', className)}>
      <div className="liquidGlass-effect" />
      <div className="liquidGlass-tint" />
      <div className="liquidGlass-shine" />
      <div className="relative z-[3] w-full">{children}</div>
    </div>
  );
}
