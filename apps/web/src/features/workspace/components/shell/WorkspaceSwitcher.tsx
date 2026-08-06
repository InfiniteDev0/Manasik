'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings,
  Users,
  AppWindow,
  List,
  Zap,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore, useWorkspaceStore } from '@/lib/store';
import GlassSurface from './GlassSurface';

interface WorkspaceSwitcherProps {
  workspaceSlug: string;
}

const PLAN_DISPLAY: Record<string, string> = {
  FREE: 'Free Forever',
  PRO: 'Growth',
  TEAM: 'Operations',
  ENTERPRISE: 'Enterprise',
};

export default function WorkspaceSwitcher({
  workspaceSlug,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.workspace);

  const displayName = user?.name ?? 'User';
  const avatarSrc =
    user?.avatar ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const workspaceName = workspace?.name ?? 'My Workspace';
  const planLabel = PLAN_DISPLAY[workspace?.plan ?? 'FREE'] ?? 'Free Forever';
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className='border-none bg-accent-foreground/10' asChild>
        <Button
          variant="outline"
          className="flex items-center w-fit px-1 pr-2 gap-2 h-7.5  text-xs"
        >
          <Avatar className="size-6">
            <AvatarImage
              className=""
              src={avatarSrc}
              alt={displayName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{workspaceName}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{ display: 'inline-flex' }}
          >
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </motion.span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 ml-2 mt-2 p-4 bg-background">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="size-8 rounded-md">
            <AvatarImage
              className="rounded-md"
              src={avatarSrc}
              alt={displayName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{workspaceName}</div>
            <div className="text-xs text-muted-foreground">
              {planLabel} • <span className="text-purple-500">Upgrade</span>
            </div>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => router.push(`/workspace/${workspaceSlug}/settings`)}
          >
            <Settings className="size-4" /> Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() =>
              router.push(`/workspace/${workspaceSlug}/settings/members`)
            }
          >
            <Users className="size-4" /> People
          </Button>
        </div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Manage
        </div>
        <div className="flex flex-col gap-1 mb-3">
          <Button variant="ghost" size="sm" className="justify-start gap-2">
            <AppWindow className="size-4" /> Pages
          </Button>
          <Button variant="ghost" size="sm" className="justify-start gap-2">
            <List className="size-4" /> Templates
          </Button>
          <Button variant="ghost" size="sm" className="justify-start gap-2">
            <Zap className="size-4" /> Ai
          </Button>
        </div>
        <Separator className="my-2" />
        {/* TODO(Phase 8i): wire Create Workspace flow */}
        <Button variant="default" className="w-full gap-2">
          <Plus className="size-4" /> Create Workspace
        </Button>
      </PopoverContent>
    </Popover>
  );
}
