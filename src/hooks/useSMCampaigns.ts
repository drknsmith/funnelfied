import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RecurrenceRule, SMPlatform } from '@/lib/socialMediaConstants';

export interface SMCampaign {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  description_brief: string | null;
  platforms: SMPlatform[];
  recurrence_rule: RecurrenceRule;
  do_dont_guidance: string | null;
  default_cta_style: string | null;
  keyword_tags: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  color: string;
  description_brief?: string;
  platforms: SMPlatform[];
  recurrence_rule: RecurrenceRule;
  do_dont_guidance?: string;
  default_cta_style?: string;
  keyword_tags?: string[];
  is_active?: boolean;
}

export function useSMCampaigns() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['sm-campaigns', profile?.workspace_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sm_campaigns')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(c => ({
        ...c,
        platforms: c.platforms as SMPlatform[],
        recurrence_rule: c.recurrence_rule as unknown as RecurrenceRule,
        keyword_tags: c.keyword_tags || [],
      })) as SMCampaign[];
    },
    enabled: !!profile?.workspace_id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data, error } = await supabase
        .from('sm_campaigns')
        .insert({
          workspace_id: profile!.workspace_id,
          name: input.name,
          color: input.color,
          description_brief: input.description_brief || null,
          platforms: input.platforms as string[],
          recurrence_rule: JSON.parse(JSON.stringify(input.recurrence_rule)),
          do_dont_guidance: input.do_dont_guidance || null,
          default_cta_style: input.default_cta_style || null,
          keyword_tags: input.keyword_tags || [],
          is_active: input.is_active ?? true,
          created_by: profile!.user_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error) => {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateCampaignInput> & { id: string }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.color !== undefined) updates.color = input.color;
      if (input.description_brief !== undefined) updates.description_brief = input.description_brief || null;
      if (input.platforms !== undefined) updates.platforms = input.platforms;
      if (input.recurrence_rule !== undefined) updates.recurrence_rule = input.recurrence_rule;
      if (input.do_dont_guidance !== undefined) updates.do_dont_guidance = input.do_dont_guidance || null;
      if (input.default_cta_style !== undefined) updates.default_cta_style = input.default_cta_style || null;
      if (input.keyword_tags !== undefined) updates.keyword_tags = input.keyword_tags;
      if (input.is_active !== undefined) updates.is_active = input.is_active;

      const { data, error } = await supabase
        .from('sm_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (error) => {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sm_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error) => {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('sm_campaigns')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-campaigns'] });
    },
    onError: (error) => {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign');
    },
  });

  return {
    campaigns,
    isLoading,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: updateMutation.mutateAsync,
    deleteCampaign: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
