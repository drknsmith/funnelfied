import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export interface WorkspaceUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  role: AppRole | null;
  created_at: string;
}

export function useWorkspaceUsers() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!profile?.workspace_id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all profiles in the workspace
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('workspace_id', profile.workspace_id);

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: WorkspaceUser[] = (profiles || []).map(p => {
        const userRole = roles?.find(r => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          is_active: p.is_active,
          role: (userRole?.role as AppRole) || null,
          created_at: p.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workspace users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile?.workspace_id]);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Refresh the users list
      await fetchUsers();

      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();

      toast({
        title: isActive ? 'User activated' : 'User deactivated',
        description: `User has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  return {
    users,
    loading,
    refetch: fetchUsers,
    updateUserRole,
    toggleUserActive,
  };
}
