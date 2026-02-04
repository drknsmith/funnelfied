// Workspace-specific feature flags

export const TRENEUR_WORKSPACE_ID = '14e69d30-13a2-45c0-bcea-0ebe6e638b47';
export const SUPERIOR_WORKSPACE_ID = 'a2b9c8d7-e6f5-4a3b-9c8d-7e6f5a4b3c2d';

export function isTreneurWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === TRENEUR_WORKSPACE_ID;
}

export function isSuperiorWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === SUPERIOR_WORKSPACE_ID;
}

export function canUseMapping(workspaceId?: string | null): boolean {
  return isTreneurWorkspace(workspaceId);
}

export function canUseProposalCreator(workspaceId?: string | null): boolean {
  return isSuperiorWorkspace(workspaceId);
}
