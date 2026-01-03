import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;

export interface LeadFilters {
  status?: string;
  facility_type?: string;
  recommended_playbook?: string;
  search?: string;
}

export function useLeads(filters: LeadFilters = {}) {
  const { profile } = useAuth();
  const { viewMode } = useViewMode();

  return useQuery({
    queryKey: ['leads', filters, viewMode, profile?.user_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];

      let query = supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('created_at', { ascending: false });

      // Apply view mode filter
      if (viewMode === 'my' && profile.user_id) {
        query = query.eq('owner_user_id', profile.user_id);
      }

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.facility_type) {
        query = query.eq('facility_type', filters.facility_type);
      }
      if (filters.recommended_playbook) {
        query = query.eq('recommended_playbook', filters.recommended_playbook);
      }
      if (filters.search) {
        query = query.or(
          `company.ilike.%${filters.search}%,project_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!profile?.workspace_id,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (lead: Omit<LeadInsert, 'workspace_id'>) => {
      if (!profile?.workspace_id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          workspace_id: profile.workspace_id,
          owner_user_id: lead.owner_user_id || profile.user_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create lead: ${error.message}`);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });
}
