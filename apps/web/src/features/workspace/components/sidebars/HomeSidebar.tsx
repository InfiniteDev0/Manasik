'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Globe,
  Home,
  Palette,
  Settings,
  ShoppingBag,
  Trash2,
  Users2,
  Star,
} from 'lucide-react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import SidebarSection from '../../../../components/workspace/sidebar-section';
import SidebarRow from '../../../../components/workspace/sidebar-row';
import Add from '@/components/workspace/Add';

const HomeSidebar = () => {
  const [activeItem, setActiveItem] = useState('');

  // Helper for consistent styling
  const navItemClasses = (itemLabel) =>
    `flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all text-zinc-200 font-medium text-[13px] ${
      activeItem === itemLabel ? 'bg-zinc-800' : 'hover:bg-zinc-900/60'
    }`;

  return (
    <div className="p-4 w-[280px]">
      <TooltipProvider delayDuration={0}>
        <aside className="relative h-[92vh] w-full flex flex-col overflow-hidden rounded-xl">
          {/* Fixed Topbar */}
          <Add />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-pill">
            {/* SECTION: Pages */}
            <SidebarSection title="Pages" showPlus defaultOpen={true}>
              <SidebarRow
                icon={<Home />}
                label="Dashboard"
                textColor="text-cyan-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<Users2 />}
                label="Customers"
                textColor="text-purple-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<CreditCard />}
                label="Payments"
                textColor="text-emerald-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<Globe />}
                label="Website"
                textColor="text-orange-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<BarChart3 />}
                label="Analytics"
                textColor="text-red-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<Palette />}
                label="Branding"
                textColor="text-pink-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
            </SidebarSection>

            <Separator />

            {/* SECTION: Favorites */}
            <SidebarSection title="Favorites" showPlus defaultOpen={true}>
              <SidebarRow
                icon={<Star />}
                label="Branding"
                glowColor="bg-yellow-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
              <SidebarRow
                icon={<Star />}
                label="Get Started"
                glowColor="bg-yellow-500"
                activeItem={activeItem}
                setActiveItem={setActiveItem}
              />
            </SidebarSection>

            <Separator />

            {/* SECTION: Plain Bottom Navigation (non-navigating for now) */}
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                className={navItemClasses('Settings')}
                onClick={() => setActiveItem('Settings')}
              >
                <Settings size={16} className="shrink-0" />
                Settings
              </button>

              <button
                type="button"
                className={navItemClasses('Marketplace')}
                onClick={() => setActiveItem('Marketplace')}
              >
                <ShoppingBag size={16} className="shrink-0" />
                Marketplace
              </button>

              <button
                type="button"
                className={navItemClasses('Bin')}
                onClick={() => setActiveItem('Bin')}
              >
                <Trash2 size={16} className="shrink-0" />
                Trash
              </button>
            </nav>
          </div>
        </aside>
      </TooltipProvider>
    </div>
  );
};

export default HomeSidebar;
