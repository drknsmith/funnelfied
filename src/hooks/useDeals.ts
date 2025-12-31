import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const DEAL_STAGES = [
  { value: 'signal_target', label: 'Signal Target' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'discovery_scheduled', label: 'Discovery Scheduled' },
  { value: 'discovery_done', label: 'Discovery Done' },
  { value: 'proposal_out', label: 'Proposal Out' },
  { value: 'decision', label: 'Decision' },
  { value: 'won', label: 'Won' },
  { value: 'lost_archived', label: 'Lost/Archived' },
  { value: 'nurture', label: 'Nurture' },
] as const;

export const DEAL_SIZES = [
  { value: 'under_10k', label: 'Under $10k' },
  { value: '10_25k', label: '$10-25k' },
  { value: '25_50k', label: '$25-50k' },
  { value: '50_100k', label: '$50-100k' },
  { value: '100k_plus', label: '$100k+' },
] as const;

export const DEAL_TYPES = [
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'design_led', label: 'Design-Led' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'other', label: 'Other' },
] as const;

export interface Deal {
  id: string;
  workspace_id: string;
  account_id: string;
  primary_contact_id: string | null;
  playbook_id: string | null;
  deal_type: string | null;
  stage: string;
  deal_size_range: string | null;
  probability: number | null;
  next_action: string | null;
  next_action_date: string | null;
  last_meaningful_activity_date: string | null;
  status: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  accounts?: { id: string; name: string } | null;
  contacts?: { id: string; name: string } | null;
  playbooks?: { id: string; name: string } | null;
}

export function useDeals(filters?: { stage?: string; status?: string }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['deals', profile?.workspace_id, filters],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select('*, accounts(id, name), contacts(id, name), playbooks(id, name)')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DealWithRelations[];
    },
    enabled: !!profile?.workspace_id,
  });

  const createDeal = useMutation({
    mutationFn: async (input: Omit<Deal, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'owner_user_id'>) => {
      if (!profile?.workspace_id) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('deals')
        .insert({ ...input, workspace_id: profile.workspace_id, owner_user_id: user?.user?.id || null })
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Deal created' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to create deal', description: error.message });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Deal updated' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to update deal', description: error.message });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Deal deleted' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to delete deal', description: error.message });
    },
  });

  return {
    deals: dealsQuery.data ?? [],
    isLoading: dealsQuery.isLoading,
    error: dealsQuery.error,
    createDeal: createDeal.mutate,
    updateDeal: updateDeal.mutate,
    deleteDeal: deleteDeal.mutate,
    isCreating: createDeal.isPending,
    isUpdating: updateDeal.isPending,
    isDeleting: deleteDeal.isPending,
  };
}

export function useDeal(id: string | undefined) {
  const query = useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*, accounts(id, name), contacts(id, name), playbooks(id, name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as DealWithRelations | null;
    },
    enabled: !!id,
  });

  return {
    deal: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}