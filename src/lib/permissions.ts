type Resource = 'accounts' | 'contacts' | 'deals' | 'interactions' | 'playbooks' | 'assets' | 'settings' | 'users';
type Crud = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';
type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export interface Permission {
  resource: Resource;
  role: AppRole;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export type PermissionMap = Record<string, Permission>;

/**
 * Check if a user has permission to perform an action on a resource.
 * Super admins and admins have full access.
 * Moderators and users check against the workspace_permissions table.
 */
export function can(
  role: AppRole | null,
  permissions: PermissionMap,
  resource: Resource,
  action: Crud
): boolean {
  // No role = no access
  if (!role) return false;

  // Super admin has full access to everything
  if (role === 'super_admin') return true;

  // Admin has full access except they can't manage super_admins
  if (role === 'admin') return true;

  // For moderator and user, check the permissions map
  const key = `${resource}:${role}`;
  const perm = permissions[key];

  if (!perm) return false;

  return !!perm[action];
}

/**
 * Build a permission map from an array of permissions.
 */
export function buildPermissionMap(permissions: Permission[]): PermissionMap {
  return Object.fromEntries(
    permissions.map((p) => [`${p.resource}:${p.role}`, p])
  );
}

/**
 * All available resources in the CRM.
 */
export const RESOURCES: Resource[] = [
  'accounts',
  'contacts',
  'deals',
  'interactions',
  'playbooks',
  'assets',
  'settings',
  'users',
];

/**
 * All CRUD actions.
 */
export const ACTIONS: Crud[] = ['can_view', 'can_create', 'can_edit', 'can_delete'];

/**
 * Roles that can have their permissions edited (not super_admin or admin).
 */
export const EDITABLE_ROLES: AppRole[] = ['moderator', 'user'];

/**
 * All available roles in order of hierarchy.
 */
export const ALL_ROLES: AppRole[] = ['super_admin', 'admin', 'moderator', 'user'];

/**
 * Role labels for display.
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
  user: 'User',
};

/**
 * Check if a role can delete another role based on hierarchy.
 * Super admins can delete anyone.
 * Admins can delete admins, moderators, users (not super_admins).
 * Moderators and users cannot delete anyone.
 */
export function canDeleteRole(currentRole: AppRole | null, targetRole: AppRole | null): boolean {
  if (!currentRole || !targetRole) return false;
  
  if (currentRole === 'super_admin') return true;
  if (currentRole === 'admin') return targetRole !== 'super_admin';
  return false;
}

/**
 * Check if a role can assign another role.
 * Super admins can assign any role.
 * Admins can assign admin, moderator, user (not super_admin).
 * Moderators and users cannot assign roles.
 */
export function canAssignRole(currentRole: AppRole | null, targetRole: AppRole): boolean {
  if (!currentRole) return false;
  
  if (currentRole === 'super_admin') return true;
  if (currentRole === 'admin') return targetRole !== 'super_admin';
  return false;
}
