import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LeadStakeholder {
  id: string;
  workspace_id: string;
  lead_id: string;
  stakeholder_name: string | null;
  stakeholder_role_type: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  confidence: string;
  notes: string | null;
  created_at: string;
}

export interface LeadStakeholderInsert {
  lead_id: string;
  stakeholder_name?: string | null;
  stakeholder_role_type: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  confidence?: string;
  notes?: string | null;
}

export const STAKEHOLDER_ROLE_TYPES = [
  'Ops / Property Mgmt',
  'Asset Management',
  'Investment / Acquisitions',
  'Construction / Development',
  'Procurement / Purchasing',
  'Design / Architecture',
  'Fitness / Wellness Director',
  'Facility Manager',
  'Other',
];

export function useLeadStakeholders(leadId: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['lead-stakeholders', leadId],
    queryFn: async () => {
      if (!leadId || !profile?.workspace_id) return [];

      const { data, error } = await supabase
        .from('lead_stakeholders')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LeadStakeholder[];
    },
    enabled: !!leadId && !!profile?.workspace_id,
  });
}

export function useCreateLeadStakeholder() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (stakeholder: LeadStakeholderInsert) => {
      if (!profile?.workspace_id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('lead_stakeholders')
        .insert({
          ...stakeholder,
          workspace_id: profile.workspace_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-stakeholders', data.lead_id] });
      toast.success('Stakeholder added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add stakeholder: ${error.message}`);
    },
  });
}

export function useUpdateLeadStakeholder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId, ...updates }: Partial<LeadStakeholder> & { id: string; leadId: string }) => {
      const { data, error } = await supabase
        .from('lead_stakeholders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, leadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-stakeholders', data.leadId] });
      toast.success('Stakeholder updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update stakeholder: ${error.message}`);
    },
  });
}

export function useDeleteLeadStakeholder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('lead_stakeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { leadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-stakeholders', data.leadId] });
      toast.success('Stakeholder removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove stakeholder: ${error.message}`);
    },
  });
}
