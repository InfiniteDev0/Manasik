export type WorkspaceSection =
  | 'home'
  | 'inbox'
  | 'library'
  | 'calendar'
  | 'docs';

export interface WorkspaceTool {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
}

export interface WorkspaceMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export interface WorkspacePage {
  id: string;
  title: string;
  icon: string | null;
  pageType: string;
  isSystem: boolean;
  position: number;
  parentId: string | null;
  workspaceId: string;
  children?: WorkspacePage[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  workspaceType: 'BUSINESS' | 'TEAM' | 'PERSONAL';
  businessCategory: string | null;
  businessType: string | null;
  emailAddress: string | null;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}
