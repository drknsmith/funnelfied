import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { canDeleteRole } from '@/lib/permissions';

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

export interface PendingInvitation {
  id: string;
  workspace_id: string;
  email: string;
  invite_code: string;
  role: AppRole;
  invited_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export function useWorkspaceUsers() {
  const { workspaceId, role: currentUserRole, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all profiles in the workspace
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('workspace_id', workspaceId);

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

  const fetchPendingInvitations = async () => {
    if (!workspaceId) return;

    try {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingInvitations((data || []) as PendingInvitation[]);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingInvitations();
  }, [workspaceId]);

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

  const deleteUser = async (userId: string, targetRole: AppRole | null) => {
    // Check if current user can delete the target user
    if (!canDeleteRole(currentUserRole, targetRole)) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to delete this user',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Then deactivate the profile (we keep the profile for audit)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      await fetchUsers();

      toast({
        title: 'User removed',
        description: 'User has been removed from the workspace',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  const updateUserName = async (userId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();

      toast({
        title: 'Name updated',
        description: 'User name has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating user name:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user name',
        variant: 'destructive',
      });
    }
  };

  const generateInviteCode = (): string => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createInvitation = async (email: string, role: AppRole) => {
    if (!workspaceId || !user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to invite users',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from('pending_invitations')
        .insert({
          workspace_id: workspaceId,
          email: email.toLowerCase().trim(),
          invite_code: inviteCode,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Error',
            description: 'An invitation for this email already exists',
            variant: 'destructive',
          });
          return null;
        }
        throw error;
      }

      await fetchPendingInvitations();

      toast({
        title: 'Invitation created',
        description: `Invite code: ${inviteCode}`,
      });

      return data as PendingInvitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      await fetchPendingInvitations();

      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been cancelled',
      });
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke invitation',
        variant: 'destructive',
      });
    }
  };

  return {
    users,
    pendingInvitations,
    loading,
    refetch: fetchUsers,
    refetchInvitations: fetchPendingInvitations,
    updateUserRole,
    toggleUserActive,
    deleteUser,
    updateUserName,
    createInvitation,
    revokeInvitation,
  };
}
