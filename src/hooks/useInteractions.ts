import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const INTERACTION_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'demo', label: 'Demo' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'other', label: 'Other' },
] as const;

export interface Interaction {
  id: string;
  workspace_id: string;
  deal_id: string;
  contact_id: string | null;
  type: string;
  summary: string | null;
  objections: string | null;
  commitments: string | null;
  external_ref: string | null;
  occurred_at: string;
  created_at: string;
}

export interface InteractionWithRelations extends Interaction {
  contacts: { id: string; name: string } | null;
}

export function useInteractions(dealId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interactions = [], isLoading, error } = useQuery({
    queryKey: ['interactions', dealId],
    queryFn: async () => {
      let query = supabase
        .from('interactions')
        .select('*, contacts(id, name)')
        .order('occurred_at', { ascending: false });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InteractionWithRelations[];
    },
    enabled: !!profile?.workspace_id,
  });

  const createMutation = useMutation({
    mutationFn: async (interaction: Omit<Interaction, 'id' | 'workspace_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          workspace_id: profile!.workspace_id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Interaction logged successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to log interaction', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Interaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast({ title: 'Interaction updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update interaction', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('interactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast({ title: 'Interaction deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete interaction', description: error.message, variant: 'destructive' });
    },
  });

  return {
    interactions,
    isLoading,
    error,
    createInteraction: createMutation.mutate,
    updateInteraction: updateMutation.mutate,
    deleteInteraction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
