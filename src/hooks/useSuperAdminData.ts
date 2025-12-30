import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceWithStats extends Workspace {
  user_count: number;
  deal_count: number;
}

interface UserWithDetails {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  workspace_id: string;
  workspace_name: string;
  is_active: boolean;
  role: string;
}

export function useSuperAdminData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all workspaces with stats
  const workspacesQuery = useQuery({
    queryKey: ['super-admin', 'workspaces'],
    queryFn: async () => {
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get counts for each workspace
      const workspacesWithStats: WorkspaceWithStats[] = await Promise.all(
        workspaces.map(async (workspace) => {
          const [profilesRes, dealsRes] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
            supabase.from('deals').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
          ]);

          return {
            ...workspace,
            user_count: profilesRes.count || 0,
            deal_count: dealsRes.count || 0,
          };
        })
      );

      return workspacesWithStats;
    },
  });

  // Fetch all users across workspaces
  const usersQuery = useQuery({
    queryKey: ['super-admin', 'users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, workspaces(name)')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles for each user
      const usersWithRoles: UserWithDetails[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            id: profile.id,
            user_id: profile.user_id,
            email: profile.email,
            full_name: profile.full_name,
            workspace_id: profile.workspace_id,
            workspace_name: (profile.workspaces as any)?.name || 'Unknown',
            is_active: profile.is_active,
            role: roleData?.role || 'user',
          };
        })
      );

      return usersWithRoles;
    },
  });

  // Create workspace
  const createWorkspace = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'workspaces'] });
      toast({ title: 'Workspace created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create workspace', description: error.message, variant: 'destructive' });
    },
  });

  // Update workspace
  const updateWorkspace = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'workspaces'] });
      toast({ title: 'Workspace updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update workspace', description: error.message, variant: 'destructive' });
    },
  });

  // Update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'super_admin' | 'admin' | 'moderator' | 'user' }) => {
      // First try to update existing role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      toast({ title: 'User role updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update user role', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle user active status
  const toggleUserActive = useMutation({
    mutationFn: async ({ profileId, isActive }: { profileId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      toast({ title: 'User status updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update user status', description: error.message, variant: 'destructive' });
    },
  });

  // System stats
  const statsQuery = useQuery({
    queryKey: ['super-admin', 'stats'],
    queryFn: async () => {
      const [workspacesRes, profilesRes, dealsRes] = await Promise.all([
        supabase.from('workspaces').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalWorkspaces: workspacesRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalDeals: dealsRes.count || 0,
      };
    },
  });

  return {
    workspaces: workspacesQuery.data ?? [],
    users: usersQuery.data ?? [],
    stats: statsQuery.data ?? { totalWorkspaces: 0, totalUsers: 0, totalDeals: 0 },
    isLoading: workspacesQuery.isLoading || usersQuery.isLoading || statsQuery.isLoading,
    createWorkspace: createWorkspace.mutate,
    updateWorkspace: updateWorkspace.mutate,
    updateUserRole: updateUserRole.mutate,
    toggleUserActive: toggleUserActive.mutate,
    isCreatingWorkspace: createWorkspace.isPending,
    isUpdatingWorkspace: updateWorkspace.isPending,
    isUpdatingUserRole: updateUserRole.isPending,
    isTogglingUserActive: toggleUserActive.isPending,
  };
}
