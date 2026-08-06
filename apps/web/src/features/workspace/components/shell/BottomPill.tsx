'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WorkspaceSection } from '@/features/workspace/types';

interface BottomPillProps {
  workspaceSlug: string;
}

// Your base 5 items
const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    src: 'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/finder.png',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    src: 'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/messages.png',
  },
  {
    id: 'library',
    label: 'Library',
    src: 'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/books.png',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    src: 'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/map.png',
  },
  {
    id: 'docs',
    label: 'Docs',
    src: 'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets/notes.png',
  },
] as const;

// Distinct demo icons from the macOS asset set (only 6 exist, so some repeat).
// Swap these for real per-section icons in /public when ready.
const ICON_BASE =
  'https://raw.githubusercontent.com/lucasromerodb/liquid-glass-effect-macos/refs/heads/main/assets';

const EXTENDED_ITEMS = [
  { id: 'projects', label: 'Projects', src: `${ICON_BASE}/books.png` },
  { id: 'views', label: 'Views', src: `${ICON_BASE}/map.png` },
  { id: 'settings', label: 'Settings', src: `${ICON_BASE}/notes.png` },
  { id: 'tools', label: 'Tools', src: `${ICON_BASE}/messages.png` },
  { id: 'members', label: 'Members', src: `${ICON_BASE}/safari.png` },
  { id: 'billing', label: 'Billing', src: `${ICON_BASE}/books.png` },
] as const;

const MORE_ITEM = {
  label: 'More',
  src: `${ICON_BASE}/safari.png`,
};

export default function BottomPill({ workspaceSlug }: BottomPillProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const activeSection = useWorkspaceStore((s) => s.activeSection);
  const setActiveSection = useWorkspaceStore((s) => s.setActiveSection);

  function handleNavigate(id: string) {
    setActiveSection(id as WorkspaceSection);
    router.push(`/workspace/${workspaceSlug}/${id}`);
  }

  return (
    <>
      {/* SVG Distortion Filter Engine */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <filter
          id="glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves={1}
            seed={5}
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
            <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
            <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale={5}
            specularConstant={1}
            specularExponent={100}
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x={-200} y={-200} z={300} />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={1}
            k4={0}
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale={150}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <TooltipProvider delayDuration={200}>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.9 }}
          className="liquidGlass-wrapper dock"
        >
          <div className="liquidGlass-effect" />
          <div className="liquidGlass-tint" />
          <div className="liquidGlass-shine" />
          <div className="liquidGlass-text">
            <div className="dock">
              {/* Core Navigation Items */}
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        className="relative bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
                      >
                        <img src={item.src} alt={item.label} draggable={false} />
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] mb-[2px] rounded-full bg-foreground"
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={10} className="text-[11px] px-2 py-1">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Seamless Inline Extra Items */}
              <AnimatePresence>
                {isExpanded && (
                  <>
                    {EXTENDED_ITEMS.map((item, index) => {
                      const isActive = activeSection === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          style={{ transformOrigin: 'bottom center' }}
                          className="flex items-center"
                          initial={{ opacity: 0, scale: 0, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: 'auto' }}
                          exit={{
                            opacity: 0,
                            scale: 0,
                            width: 0,
                            transition: { duration: 0.18, ease: 'easeIn' },
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 16,
                            mass: 0.7,
                            delay: index * 0.05,
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleNavigate(item.id)}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                className="relative bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
                              >
                                <img src={item.src} alt={item.label} draggable={false} />
                                {isActive && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-foreground"
                                  />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={10}
                              className="text-[11px] px-2 py-1"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </AnimatePresence>

              {/* More Trigger Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={MORE_ITEM.label}
                    className="relative bg-transparent border-0 p-0 cursor-pointer focus:outline-none transition-transform duration-300"
                    style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                  >
                    <img src={MORE_ITEM.src} alt={MORE_ITEM.label} draggable={false} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={10} className="text-[11px] px-2 py-1">
                  {isExpanded ? 'Less' : 'More'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    </>
  );
}
