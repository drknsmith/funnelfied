import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RESOURCES, ACTIONS, EDITABLE_ROLES } from '@/lib/permissions';

type Resource = 'accounts' | 'contacts' | 'deals' | 'interactions' | 'playbooks' | 'settings' | 'users';
type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';
type Crud = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';

export interface WorkspacePermission {
  id: string;
  workspace_id: string;
  resource: Resource;
  role: AppRole;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function useWorkspacePermissions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<WorkspacePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!profile?.workspace_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspace_permissions')
        .select('*')
        .eq('workspace_id', profile.workspace_id);

      if (error) throw error;

      setPermissions(data as WorkspacePermission[]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [profile?.workspace_id]);

  const getPermission = (resource: Resource, role: AppRole): WorkspacePermission | undefined => {
    return permissions.find(p => p.resource === resource && p.role === role);
  };

  const togglePermission = async (resource: Resource, role: AppRole, action: Crud) => {
    if (!profile?.workspace_id) return;

    const existing = getPermission(resource, role);
    const newValue = existing ? !existing[action] : true;

    try {
      if (existing) {
        // Update existing permission
        const { error } = await supabase
          .from('workspace_permissions')
          .update({ [action]: newValue } as never)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new permission record
        const newPerm: Partial<WorkspacePermission> = {
          workspace_id: profile.workspace_id,
          resource,
          role,
          can_view: action === 'can_view' ? newValue : false,
          can_create: action === 'can_create' ? newValue : false,
          can_edit: action === 'can_edit' ? newValue : false,
          can_delete: action === 'can_delete' ? newValue : false,
        };

        const { error } = await supabase
          .from('workspace_permissions')
          .insert([newPerm as any]);

        if (error) throw error;
      }

      await fetchPermissions();

      toast({
        title: 'Permission updated',
        description: `${action.replace('can_', '').charAt(0).toUpperCase() + action.replace('can_', '').slice(1)} permission ${newValue ? 'granted' : 'revoked'} for ${role}s on ${resource}`,
      });
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
    }
  };

  return {
    permissions,
    loading,
    refetch: fetchPermissions,
    getPermission,
    togglePermission,
    resources: RESOURCES,
    actions: ACTIONS,
    editableRoles: EDITABLE_ROLES,
  };
}
