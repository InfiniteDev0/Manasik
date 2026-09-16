import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton shell shown while any workspace page streams in. */
export default function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Page heading */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat tiles */}
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-25 rounded-xl" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="ml-auto h-8 w-28" />
      </div>

      {/* Table / list */}
      <div className="overflow-hidden rounded-lg border">
        <Skeleton className="h-9 w-full rounded-none" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-4 py-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="hidden h-4 w-1/6 sm:block" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
