import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { buildPermissionMap, can, PermissionMap, Permission } from '@/lib/permissions';

type Resource = 'accounts' | 'contacts' | 'deals' | 'interactions' | 'playbooks' | 'settings' | 'users';
type Crud = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';

export function usePermissions() {
  const { profile, role } = useAuth();
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // Cast to correct type - the database returns app_role as string
        const typedPermissions = (data || []).map(p => ({
          ...p,
          resource: p.resource as Resource,
          role: p.role as Permission['role'],
        })) as Permission[];

        setPermissions(buildPermissionMap(typedPermissions));
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [profile?.workspace_id]);

  const checkPermission = (resource: Resource, action: Crud): boolean => {
    return can(role, permissions, resource, action);
  };

  return {
    permissions,
    loading,
    can: checkPermission,
  };
}