'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { generateSlug } from '@manasik/utils';
import {
  DEFAULT_TOOLS_BY_CATEGORY,
  DEFAULT_TOOLS_BY_WORKSPACE_TYPE,
} from '../config/onboarding.config';
import type {
  OnboardingActions,
  OnboardingState,
  PlanId,
  TeamSizeId,
  WorkspaceTypeId,
} from '../types';

export type { OnboardingState };

const initialState: OnboardingState = {
  workspaceName: '',
  slug: '',
  slugAvailable: null,
  slugChecking: false,
  workspaceType: null,
  businessCategory: null,
  businessType: null,
  selectedTools: [],
  teamSize: null,
  inviteEmails: [],
  selectedPlan: 'FREE',
  currentStep: 1,
  isSubmitting: false,
  isComplete: false,
  workspaceSlug: null,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Map onboarding PlanId → backend Plan enum value
const planMap: Record<string, string> = {
  FREE: 'FREE',
  GROWTH: 'PRO',
  TEAM: 'TEAM',
  ENTERPRISE: 'ENTERPRISE',
};

function useOnboarding(): OnboardingState & OnboardingActions {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(initialState);

  const setWorkspaceName = useCallback((name: string) => {
    const newSlug = generateSlug(name);
    setState((prev) => ({
      ...prev,
      workspaceName: name,
      slug: newSlug,
      slugAvailable: null,
    }));
  }, []);

  const setSlug = useCallback((slug: string) => {
    setState((prev) => ({ ...prev, slug, slugAvailable: null }));
  }, []);

  const setWorkspaceType = useCallback((type: WorkspaceTypeId) => {
    setState((prev) => {
      // PERSONAL/TEAM auto-select tools by type; BUSINESS waits for category.
      let nextTools = prev.selectedTools;
      if (type === 'PERSONAL' || type === 'TEAM') {
        nextTools = DEFAULT_TOOLS_BY_WORKSPACE_TYPE[type] ?? [];
      }
      return { ...prev, workspaceType: type, selectedTools: nextTools };
    });
  }, []);

  const setBusinessCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      businessCategory: category,
      businessType: null,
      selectedTools: DEFAULT_TOOLS_BY_CATEGORY[category] ?? [],
    }));
  }, []);

  const setBusinessType = useCallback((type: string) => {
    setState((prev) => ({ ...prev, businessType: type }));
  }, []);

  const setSelectedTools = useCallback((tools: string[]) => {
    setState((prev) => ({ ...prev, selectedTools: tools }));
  }, []);

  const toggleTool = useCallback((toolId: string) => {
    setState((prev) => {
      const isIn = prev.selectedTools.includes(toolId);
      return {
        ...prev,
        selectedTools: isIn
          ? prev.selectedTools.filter((t) => t !== toolId)
          : [...prev.selectedTools, toolId],
      };
    });
  }, []);

  const setTeamSize = useCallback((size: TeamSizeId) => {
    setState((prev) => ({ ...prev, teamSize: size }));
  }, []);

  const addInviteEmail = useCallback((email: string) => {
    setState((prev) => {
      if (prev.inviteEmails.includes(email)) {
        return prev;
      }
      if (!EMAIL_REGEX.test(email)) {
        return prev;
      }
      return { ...prev, inviteEmails: [...prev.inviteEmails, email] };
    });
  }, []);

  const removeInviteEmail = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      inviteEmails: prev.inviteEmails.filter((e) => e !== email),
    }));
  }, []);

  const setSelectedPlan = useCallback((plan: PlanId) => {
    setState((prev) => ({ ...prev, selectedPlan: plan }));
  }, []);

  const getMaxStep = useCallback(() => {
    if (state.workspaceType === 'BUSINESS') {
      return 7;
    }
    if (state.workspaceType === 'TEAM' || state.workspaceType === 'PERSONAL') {
      return 6;
    }
    return 7;
  }, [state.workspaceType]);

  const goNext = useCallback(() => {
    setState((prev) => {
      // Skip step 3 (business category) for non-BUSINESS types
      if (prev.workspaceType !== 'BUSINESS' && prev.currentStep === 2) {
        return { ...prev, currentStep: 4 };
      }
      return { ...prev, currentStep: prev.currentStep + 1 };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      // Going back from step 4 → step 2 for non-BUSINESS types (skip 3)
      if (prev.workspaceType !== 'BUSINESS' && prev.currentStep === 4) {
        return { ...prev, currentStep: 2 };
      }
      return { ...prev, currentStep: prev.currentStep - 1 };
    });
  }, []);

  const checkSlug = useCallback(async (slug: string) => {
    setState((prev) => ({ ...prev, slugChecking: true }));
    try {
      const result = await apiFetch<{ available: boolean }>(
        `/workspaces/check-slug?slug=${encodeURIComponent(slug)}`,
      );
      setState((prev) => ({
        ...prev,
        slugAvailable: result.available,
        slugChecking: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        slugAvailable: null,
        slugChecking: false,
      }));
    }
  }, []);

  const submitWorkspace = useCallback(async () => {
    // Snapshot current state at call time so any in-flight state changes
    // don't leak into the request body.
    const snapshot = state;
    setState((prev) => ({ ...prev, isSubmitting: true }));

    const accessToken = useAuthStore.getState().accessToken ?? undefined;

    try {
      const result = await apiFetch<{ workspace: { slug: string } }>(
        '/workspaces',
        {
          method: 'POST',
          token: accessToken,
          onTokenRefreshed: (t) => useAuthStore.getState().setToken(t),
          onRefreshFailed: () => router.push('/auth'),
          body: {
            name: snapshot.workspaceName,
            slug: snapshot.slug,
            workspaceType: snapshot.workspaceType,
            businessCategory: snapshot.businessCategory,
            businessType: snapshot.businessType,
            selectedTools: snapshot.selectedTools,
            teamSize: snapshot.teamSize,
            plan: planMap[snapshot.selectedPlan] ?? 'FREE',
          },
        },
      );
      setState((prev) => ({
        ...prev,
        workspaceSlug: result.workspace.slug,
        isComplete: true,
        isSubmitting: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw err;
    }
  }, [state, router]);

  return {
    ...state,
    setWorkspaceName,
    setSlug,
    setWorkspaceType,
    setBusinessCategory,
    setBusinessType,
    setSelectedTools,
    toggleTool,
    setTeamSize,
    addInviteEmail,
    removeInviteEmail,
    setSelectedPlan,
    goNext,
    goBack,
    checkSlug,
    submitWorkspace,
    getMaxStep,
  };
}

export default useOnboarding;
