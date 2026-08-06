'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Palette,
  Keyboard,
  Download,
  HelpCircle,
  PlusCircle,
  Briefcase,
  Clock,
  FileText,
  Video,
  Bell,
  StickyNote,
  Presentation,
  Users,
  LayoutDashboard,
  Sparkles,
  Trash2,
  LogOut,
  Star,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore, useWorkspaceStore } from '@/lib/store';
import { apiFetch } from '@/lib/api';
import ThemesDialog from '@/components/workspace/ThemesDialog';

interface UserMenuProps {
  workspaceSlug: string;
}

interface MenuActionProps {
  icon: ReactNode;
  label: string;
  extra?: ReactNode;
  showPin?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export default function UserMenu({ workspaceSlug }: UserMenuProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [themesOpen, setThemesOpen] = useState(false);
  const displayName = user?.name ?? 'User';
  const avatarSrc =
    user?.avatar ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Swallow — local cleanup proceeds either way.
    }
    clearAuth();
    useWorkspaceStore.getState().reset();
    router.push('/auth');
  }

  return (
    <>
      <div className="w-70 py-2 font-sans animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto scrollbar-thin bg-background scrollbar-pill">
        {/* Top Header Section */}
        <div className="px-2 pb-2 mb-2">
          <div className="flex items-center justify-between p-2 rounded-xl group hover:bg-accent transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <img src={avatarSrc} alt="" className="size-10 rounded-full" />
                </div>
                <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-foreground leading-tight">{displayName}</span>
                <span className="text-[12px] text-muted-foreground">Online</span>
              </div>
            </div>
            <div className="px-3 py-1 opacity-0 group-hover:opacity-100 rounded-full group-hover:bg-foreground transition-colors duration-300">
              <span className="text-[12px] font-medium group-hover:text-background">Profile</span>
            </div>
          </div>
        </div>
        <Separator className="my-1" />

        {/* Settings Section */}
        <div className="px-2 space-y-0.5 pb-2 mb-2">
          <MenuAction icon={<Volume2 size={18} />} label="Mute notifications" />
          <MenuAction
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => router.push(`/workspace/${workspaceSlug}/settings`)}
          />
          <MenuAction
            icon={<Palette size={18} />}
            label="Themes"
            onClick={() => setThemesOpen(true)}
          />
          <MenuAction icon={<Keyboard size={18} />} label="Keyboard shortcuts" />
          <MenuAction
            icon={<Download size={18} />}
            label="Download Lenzro"
            extra={<ExternalLink size={14} />}
          />
          <MenuAction icon={<HelpCircle size={18} />} label="Help" />
        </div>
        <Separator className="my-1" />

        {/* Utilities Section */}
        <div className="px-2 pb-2 mb-2">
          <div className="px-3 py-2 text-[12px] text-muted-foreground tracking-wider">
            Utilities
          </div>
          <div className="space-y-0.5">
            <MenuAction icon={<PlusCircle size={18} />} label="Create task" showPin />
            <MenuAction icon={<Briefcase size={18} />} label="My Work" showPin />
            <MenuAction icon={<Clock size={18} />} label="Track Time" showPin />
            <MenuAction icon={<FileText size={18} />} label="Notepad" showPin />
            <MenuAction icon={<Video size={18} />} label="Record a Clip" showPin />
            <MenuAction icon={<Bell size={18} />} label="Create Reminder" showPin />
            <MenuAction icon={<StickyNote size={18} />} label="Create Doc" showPin />
            <MenuAction icon={<Presentation size={18} />} label="Create Whiteboard" showPin />
            <MenuAction icon={<Users size={18} />} label="View People" showPin />
            <MenuAction
              icon={<LayoutDashboard size={18} />}
              label="Create Dashboard"
              showPin
              isActive
            />
            <MenuAction icon={<Sparkles size={18} />} label="AI Chat" showPin />
          </div>
        </div>
        <Separator className="my-1" />

        {/* Footer Section */}
        <div className="px-2 space-y-0.5">
          <MenuAction icon={<Trash2 size={18} />} label="Trash" />
          <MenuAction icon={<LogOut size={18} />} label="Log out" onClick={handleLogout} />
        </div>
      </div>
      <ThemesDialog open={themesOpen} onClose={() => setThemesOpen(false)} />
    </>
  );
}

function MenuAction({
  icon,
  label,
  extra,
  showPin,
  isActive,
  onClick,
}: MenuActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-all relative
        ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-foreground hover:text-accent-foreground'}
      `}
    >
      <div className="flex items-center gap-3">
        <span
          className={
            isActive ? 'text-accent-foreground' : 'text-foreground group-hover:text-accent-foreground'
          }
        >
          {icon}
        </span>
        <span className="text-[13px] transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="group-hover:text-accent-foreground">{extra}</span>
        {showPin && (
          <Star
            size={16}
            className={`transition-opacity
              ${
                isActive
                  ? 'opacity-100 fill-current text-accent-foreground'
                  : 'opacity-0 group-hover:opacity-100 text-muted-foreground group-hover:text-accent-foreground'
              }
            `}
          />
        )}
      </div>
    </button>
  );
}
