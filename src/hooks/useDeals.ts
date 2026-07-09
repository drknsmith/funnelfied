import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';

export const DEAL_STAGES = [
  { value: 'signal_target', label: 'Signal / Target' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'sow', label: 'SOW' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
] as const;

export const DEAL_SIZES = [
  { value: 'under_25k', label: '< $25k' },
  { value: '25k_75k', label: '$25k–$75k' },
  { value: '75k_150k', label: '$75k–$150k' },
  { value: '150k_300k', label: '$150k–$300k' },
  { value: '300k_plus', label: '$300k+' },
] as const;

export const DEAL_TYPES = [
  { value: 'single_site', label: 'Single-Site / Fast Turn' },
  { value: 'portfolio', label: 'Portfolio / Standardization' },
  { value: 'design_led', label: 'Design-Led / Early Signal' },
  { value: 'retrofit', label: 'Retrofit / Value / Distressed' },
] as const;

export const BUYING_MOTIVES = [
  { value: 'design', label: 'Design' },
  { value: 'roi', label: 'ROI' },
  { value: 'speed', label: 'Speed' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'replacement', label: 'Replacement / Failure' },
] as const;

export const BUYER_ROLES = [
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'asset_manager', label: 'Asset Manager' },
  { value: 'architect_designer', label: 'Architect / Designer' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'developer', label: 'Developer' },
  { value: 'other', label: 'Other' },
] as const;

// Treneur-specific options
export const TRENEUR_DEAL_TYPES = [
  { value: 'college_university', label: 'College/University' },
  { value: 'career_services', label: 'Career Services' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'facility_signup', label: 'Facility Sign-up' },
  { value: 'trainer_signup', label: 'Trainer Sign-up' },
] as const;

export const REDLOFT_DEAL_TYPES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'policy', label: 'Policy' },
] as const;

export const TRENEUR_PARTNERSHIP_MOTIVES = [
  { value: 'maximize_revenue', label: 'Maximize revenue' },
  { value: 'new_revenue_opportunity', label: 'New revenue opportunity' },
  { value: 'space_capacity', label: 'Space capacity' },
  { value: 'ai', label: 'AI' },
  { value: 'crm', label: 'CRM' },
  { value: 'marketplace', label: 'Marketplace' },
] as const;

export const TRENEUR_PARTNER_ROLES = [
  { value: 'college_professor', label: 'College Professor' },
  { value: 'college_student', label: 'College Student' },
  { value: 'college_career_services', label: 'College Career Services' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'facility_owner', label: 'Facility Owner' },
  { value: 'facility_manager', label: 'Facility Manager' },
] as const;

export const OBJECTION_TYPES = [
  { value: 'price', label: 'Price' },
  { value: 'lead_time', label: 'Lead time' },
  { value: 'design_constraints', label: 'Design constraints' },
  { value: 'brand_standard', label: 'Brand standard' },
  { value: 'budget_timing', label: 'Budget timing' },
  { value: 'service_warranty', label: 'Service / warranty' },
] as const;

export const PROBABILITY_LEVELS = [
  { value: 'low', label: 'Low', numeric: 25 },
  { value: 'medium', label: 'Medium', numeric: 50 },
  { value: 'high', label: 'High', numeric: 75 },
] as const;

export interface Deal {
  id: string;
  workspace_id: string;
  account_id: string;
  deal_name: string | null;
  primary_contact_id: string | null;
  playbook_id: string | null;
  deal_type: string[] | null;
  stage: string;
  deal_size_range: string | null;
  probability: number | null;
  next_action: string | null;
  next_action_date: string | null;
  last_meaningful_activity_date: string | null;
  status: string;
  owner_user_id: string | null;
  trigger_signal: string | null;
  buying_motive: string | null;
  primary_buyer_role: string | null;
  primary_objection: string | null;
  objection_notes: string | null;
  proposal_link: string | null;
  proposal_requested_date: string | null;
  proposal_submitted_date: string | null;
  site_notes: string | null;
  internal_notes: string | null;
  playbook_assigned_at: string | null;
  playbook_assigned_by: string | null;
  project_street: string | null;
  project_city: string | null;
  project_state: string | null;
  project_zip: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  accounts?: { id: string; name: string; location?: string | null } | null;
  contacts?: { id: string; name: string } | null;
  playbooks?: { id: string; name: string } | null;
}

export function useDeals(filters?: { stage?: string; status?: string }) {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['deals', workspaceId, filters, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select('*, accounts(id, name, location), contacts(id, name), playbooks(id, name)')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Filter by owner when in 'my' mode
      if (viewMode === 'my' && user?.id) {
        query = query.eq('owner_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DealWithRelations[];
    },
    enabled: !!workspaceId,
  });

  const createDeal = useMutation({
    mutationFn: async (input: Omit<Deal, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'owner_user_id'>) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('deals')
        .insert({ ...input, workspace_id: workspaceId, owner_user_id: user?.id || null })
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
        .select('*, accounts(id, name, location), contacts(id, name), playbooks(id, name)')
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
