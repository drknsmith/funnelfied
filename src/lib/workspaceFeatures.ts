// Workspace-specific feature flags

export const TRENEUR_WORKSPACE_ID = '14e69d30-13a2-45c0-bcea-0ebe6e638b47';
export const SUPERIOR_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
export const REDLOFT_WORKSPACE_ID = '54d6d4a3-75f1-4e5c-9d36-945c1643ac1f';

export function isTreneurWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === TRENEUR_WORKSPACE_ID;
}

export function isSuperiorWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === SUPERIOR_WORKSPACE_ID;
}

export function isRedLoftWorkspace(workspaceId?: string | null): boolean {
  return workspaceId === REDLOFT_WORKSPACE_ID;
}

export function canUseMapping(workspaceId?: string | null): boolean {
  return isTreneurWorkspace(workspaceId);
}

export function canUseProposalCreator(workspaceId?: string | null): boolean {
  return isSuperiorWorkspace(workspaceId);
}

// Alias for clarity - Research is the user-facing name
export function canUseResearch(workspaceId?: string | null): boolean {
  return isSuperiorWorkspace(workspaceId) || isRedLoftWorkspace(workspaceId);
}

export function canUseSocialMedia(workspaceId?: string | null): boolean {
  return isTreneurWorkspace(workspaceId);
}
