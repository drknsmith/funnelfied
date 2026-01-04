// Workspace-specific feature flags

export const TRENEUR_WORKSPACE_ID = '14e69d30-13a2-45c0-bcea-0ebe6e638b47';

export function isTreneurWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === TRENEUR_WORKSPACE_ID;
}

export function canUseMapping(workspaceId?: string | null): boolean {
  return isTreneurWorkspace(workspaceId);
}
