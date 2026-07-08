import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Playbook {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  associated_deal_type: string | null;
  objective: string | null;
  trigger: string | null;
  first_message_email_template: string | null;
  first_message_linkedin_template: string | null;
  proof_asset_type: string | null;
  proof_asset_url: string | null;
  proof_asset_file_ref: string | null;
  proof_asset_label: string | null;
  followup_day3_template: string | null;
  followup_day10_template: string | null;
  followup_day21_template: string | null;
  expansion_seed: string | null;
  exit_rule: string | null;
  default_nurture_tag: string | null;
  expedited: boolean | null;
  owner_user_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  kind: string;
  opp_programming: string | null;
  opp_design: string | null;
  opp_policy: string | null;
  eng_one_time: string | null;
  eng_retainer: string | null;
  eng_phased: string | null;
  dtype_new_construction: string | null;
  dtype_retrofit: string | null;
  design_details: string | null;
  programming_details: string | null;
  policy_details: string | null;
}

export interface PlaybookFormData {
  name: string;
  status: string;
  associated_deal_type?: string;
  objective?: string;
  trigger?: string;
  first_message_email_template?: string;
  first_message_linkedin_template?: string;
  proof_asset_type?: string;
  proof_asset_url?: string;
  proof_asset_file_ref?: string;
  proof_asset_label?: string;
  followup_day3_template?: string;
  followup_day10_template?: string;
  followup_day21_template?: string;
  expansion_seed?: string;
  exit_rule?: string;
  default_nurture_tag?: string;
  expedited?: boolean;
  kind?: string;
  opp_programming?: string | null;
  opp_design?: string | null;
  opp_policy?: string | null;
  eng_one_time?: string | null;
  eng_retainer?: string | null;
  eng_phased?: string | null;
  dtype_new_construction?: string | null;
  dtype_retrofit?: string | null;
  design_details?: string | null;
  programming_details?: string | null;
  policy_details?: string | null;
}

export const PLAYBOOK_DEAL_TYPES = [
  { value: 'single_site', label: 'Single-Site' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'design_led', label: 'Design-Led' },
  { value: 'retrofit', label: 'Retrofit' },
];

export const PLAYBOOK_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const MERGE_VARIABLES = [
  '{{FirstName}}',
  '{{LastName}}',
  '{{ContactName}}',
  '{{Account}}',
  '{{AccountName}}',
  '{{DealStage}}',
  '{{DealType}}',
  '{{DealSizeRange}}',
  '{{NextActionDate}}',
  '{{YourName}}',
];

interface UsePlaybooksOptions {
  search?: string;
  dealType?: string;
  status?: string;
  kind?: string;
}

export function usePlaybooks(options: UsePlaybooksOptions = {}) {
  const { workspaceId } = useAuth();
  const queryClient = useQueryClient();

  const { data: playbooks = [], isLoading, error } = useQuery({
    queryKey: ['playbooks', workspaceId, options],
    queryFn: async () => {
      if (!workspaceId) return [];

      let query = supabase
        .from('playbooks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.dealType) {
        query = query.eq('associated_deal_type', options.dealType);
      }

      if (options.kind) {
        query = query.eq('kind', options.kind);
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,objective.ilike.%${options.search}%,associated_deal_type.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Playbook[];
    },
    enabled: !!workspaceId,
  });

  const createPlaybook = useMutation({
    mutationFn: async (formData: PlaybookFormData) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('playbooks')
        .insert({
          ...formData,
          workspace_id: workspaceId,
          owner_user_id: user?.id,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  const updatePlaybook = useMutation({
    mutationFn: async ({ id, ...formData }: PlaybookFormData & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('playbooks')
        .update({
          ...formData,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  const deletePlaybook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playbooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  const archivePlaybook = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('playbooks')
        .update({
          status: 'archived',
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  const duplicatePlaybook = useMutation({
    mutationFn: async (id: string) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data: original, error: fetchError } = await supabase
        .from('playbooks')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();

      const { id: _, created_at, updated_at, owner_user_id, ...rest } = original;
      const { data, error } = await supabase
        .from('playbooks')
        .insert({
          ...rest,
          name: `${original.name} (Copy)`,
          owner_user_id: user?.id,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  return {
    playbooks,
    isLoading,
    error,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    archivePlaybook,
    duplicatePlaybook,
  };
}

export function usePlaybook(id: string | undefined) {
  const { data: playbook, isLoading, error } = useQuery({
    queryKey: ['playbook', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Playbook;
    },
    enabled: !!id,
  });

  return { playbook, isLoading, error };
}

export function usePlaybookUsage(id: string | undefined) {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['playbook-usage', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          stage,
          status,
          account:accounts(name)
        `)
        .eq('playbook_id', id);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return { deals, isLoading };
}
