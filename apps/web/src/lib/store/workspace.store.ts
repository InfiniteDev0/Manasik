import { create } from 'zustand';
import type {
  Workspace,
  WorkspacePage,
  WorkspaceSection,
  WorkspaceTool,
} from '@/features/workspace/types';

interface WorkspaceStore {
  // Data
  workspace: Workspace | null;
  pages: WorkspacePage[];
  tools: WorkspaceTool[];

  // Navigation
  activeSection: WorkspaceSection;
  activePage: string | null;

  // UI state
  sidebarCollapsed: boolean;
  userMenuOpen: boolean;
  workspaceSwitcherOpen: boolean;

  // Actions
  setWorkspace: (w: Workspace) => void;
  setPages: (pages: WorkspacePage[]) => void;
  setTools: (tools: WorkspaceTool[]) => void;
  setActiveSection: (s: WorkspaceSection) => void;
  setActivePage: (id: string | null) => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  setUserMenuOpen: (open: boolean) => void;
  setWorkspaceSwitcherOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  workspace: null,
  pages: [],
  tools: [],
  activeSection: 'home' as WorkspaceSection,
  activePage: null,
  sidebarCollapsed: false,
  userMenuOpen: false,
  workspaceSwitcherOpen: false,
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  ...initialState,

  setWorkspace: (workspace) => set({ workspace }),
  setPages: (pages) => set({ pages }),
  setTools: (tools) => set({ tools }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setActivePage: (activePage) => set({ activePage }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  collapseSidebar: () => set({ sidebarCollapsed: true }),
  expandSidebar: () => set({ sidebarCollapsed: false }),
  setUserMenuOpen: (userMenuOpen) => set({ userMenuOpen }),
  setWorkspaceSwitcherOpen: (workspaceSwitcherOpen) =>
    set({ workspaceSwitcherOpen }),
  reset: () => set(initialState),
}));
