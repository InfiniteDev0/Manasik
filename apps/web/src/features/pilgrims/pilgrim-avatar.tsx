import { cn } from '@/lib/utils';

interface PilgrimAvatarProps {
  name: string;
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * Initials avatar.
 *
 * <p>No photos in the MVP, and a row of identical grey silhouettes is worse
 * than nothing — initials at least distinguish two people at a glance.
 */
export function PilgrimAvatar({ name, size = 'sm', className }: PilgrimAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        size === 'sm' ? 'size-8 text-xs' : 'size-14 text-lg',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/**
 * First and last initials.
 *
 * <p>Names here are commonly four or five parts ("Ahmed Hassan Mohamed Ali"),
 * so taking the first two words would give every second person "AH".
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
