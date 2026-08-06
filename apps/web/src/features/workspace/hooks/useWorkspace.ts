'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore, useWorkspaceStore } from '@/lib/store';
import type { Workspace, WorkspacePage } from '@/features/workspace/types';

interface WorkspaceApiResponse {
  workspace: Workspace & { pages?: WorkspacePage[] };
}

export function useWorkspace(slug: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const accessToken = useAuthStore.getState().accessToken ?? undefined;

    apiFetch<WorkspaceApiResponse>(`/workspaces/${slug}`, {
      token: accessToken,
      onTokenRefreshed: (t) => useAuthStore.getState().setToken(t),
      onRefreshFailed: () => router.push('/auth'),
    })
      .then((data) => {
        if (cancelled) {
          return;
        }
        const store = useWorkspaceStore.getState();
        store.setWorkspace(data.workspace);
        store.setPages(data.workspace.pages ?? []);
        // Tools not yet returned by API — derived defaults will land in 8d
        store.setTools([]);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to load workspace';
        setError(message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      useWorkspaceStore.getState().reset();
    };
  }, [slug, router]);

  return { isLoading, error };
}
