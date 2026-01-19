import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
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
  deal_id: string | null;
  contact_id: string | null;
  type: string;
  summary: string | null;
  objections: string | null;
  commitments: string | null;
  next_action: string | null;
  next_action_date: string | null;
  external_ref: string | null;
  occurred_at: string;
  created_at: string;
}

export interface InteractionWithRelations extends Interaction {
  contacts: { id: string; name: string; owner_user_id: string | null } | null;
  deals?: { owner_user_id: string | null } | null;
}

export function useInteractions(dealId?: string, contactId?: string) {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interactions = [], isLoading, error } = useQuery({
    queryKey: ['interactions', workspaceId, dealId, contactId, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('interactions')
        .select('*, contacts(id, name, owner_user_id), deals(owner_user_id)')
        .order('occurred_at', { ascending: false });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by deal/contact owner when in 'my' mode
      if (viewMode === 'my' && user?.id && !dealId && !contactId) {
        return (data as InteractionWithRelations[]).filter(
          (interaction) => 
            interaction.deals?.owner_user_id === user.id ||
            interaction.contacts?.owner_user_id === user.id
        );
      }

      return data as InteractionWithRelations[];
    },
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: async (interaction: Omit<Interaction, 'id' | 'workspace_id' | 'created_at'>) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          ...interaction,
          workspace_id: workspaceId,
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
