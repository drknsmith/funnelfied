import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  segment: string | null;
  portfolio_size: string;
  deal_type_default: string | null;
  buying_motive: string | null;
  status: string;
  expansion_notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountInput = Omit<Account, 'id' | 'created_at' | 'updated_at'>;

export function useAccounts() {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['accounts', workspaceId, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('accounts')
        .select('*')
        .order('name');

      // Filter by owner when in 'my' mode
      if (viewMode === 'my' && user?.id) {
        query = query.eq('owner_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Account[];
    },
    enabled: !!workspaceId,
  });

  const createAccount = useMutation({
    mutationFn: async (input: Omit<AccountInput, 'workspace_id' | 'owner_user_id'>) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...input, workspace_id: workspaceId, owner_user_id: user?.id || null })
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account created' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to create account', description: error.message });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account updated' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to update account', description: error.message });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({ title: 'Account deleted' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to delete account', description: error.message });
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    error: accountsQuery.error,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Account | null;
    },
    enabled: !!id,
  });
}
