import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ProposalOutputs, SelectedDemographics, PropertyClass, AdvancedOverrides } from '@/lib/superiorProposalAlgorithm';

export interface ProposalReportData {
  communityName: string;
  communityAddress: string;
  units?: number;
  sfOverride?: number;
  propertyClass: PropertyClass;
  demographics: SelectedDemographics;
  compsRadius: number;
  advancedOverrides: AdvancedOverrides;
  outputs: ProposalOutputs;
  multifamilyComps: any[];
  fitnessComps: any[];
  mapCenter?: { lat: number; lng: number };
  dealId?: string;
}

export interface SavedReport {
  id: string;
  token: string;
  communityName: string;
  communityAddress: string;
  units: number | null;
  sfOverride: number | null;
  propertyClass: string;
  demographics: SelectedDemographics;
  compsRadius: number;
  advancedOverrides: AdvancedOverrides;
  outputs: ProposalOutputs;
  multifamilyComps: any[];
  fitnessComps: any[];
  mapCenter: { lat: number; lng: number } | null;
  expiresAt: string | null;
  createdAt: string;
  dealId: string | null;
  workspaceId: string | null;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useProposalReport() {
  const { profile, activeWorkspaceId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const saveReport = async (
    data: ProposalReportData,
    expirationDays?: number
  ): Promise<{ token: string; url: string; id: string } | null> => {
    if (!profile?.user_id || !activeWorkspaceId) {
      toast.error('You must be logged in to save reports');
      return null;
    }

    setIsSaving(true);
    try {
      const token = generateToken();
      const expiresAt = expirationDays 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: insertedData, error } = await supabase
        .from('proposal_reports')
        .insert({
          workspace_id: activeWorkspaceId,
          owner_user_id: profile.user_id,
          token,
          community_name: data.communityName,
          community_address: data.communityAddress,
          units: data.units || null,
          sf_override: data.sfOverride || null,
          property_class: data.propertyClass,
          demographics: data.demographics as any,
          comps_radius: data.compsRadius,
          advanced_overrides: data.advancedOverrides as any,
          outputs: data.outputs as any,
          multifamily_comps: data.multifamilyComps as any,
          fitness_comps: data.fitnessComps as any,
          map_center: data.mapCenter as any || null,
          expires_at: expiresAt,
          deal_id: data.dealId || null
        })
        .select('id')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/superior/reports/${token}`;
      toast.success('Research saved! Link copied to clipboard.');
      
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard access may be denied
      }

      return { token, url, id: insertedData.id };
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save research');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateReport = async (
    reportId: string,
    data: Partial<ProposalReportData>
  ): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const updateData: any = {};
      
      if (data.communityName !== undefined) updateData.community_name = data.communityName;
      if (data.communityAddress !== undefined) updateData.community_address = data.communityAddress;
      if (data.units !== undefined) updateData.units = data.units || null;
      if (data.sfOverride !== undefined) updateData.sf_override = data.sfOverride || null;
      if (data.propertyClass !== undefined) updateData.property_class = data.propertyClass;
      if (data.demographics !== undefined) updateData.demographics = data.demographics as any;
      if (data.compsRadius !== undefined) updateData.comps_radius = data.compsRadius;
      if (data.advancedOverrides !== undefined) updateData.advanced_overrides = data.advancedOverrides as any;
      if (data.outputs !== undefined) updateData.outputs = data.outputs as any;
      if (data.multifamilyComps !== undefined) updateData.multifamily_comps = data.multifamilyComps as any;
      if (data.fitnessComps !== undefined) updateData.fitness_comps = data.fitnessComps as any;
      if (data.mapCenter !== undefined) updateData.map_center = data.mapCenter as any || null;

      const { error } = await supabase
        .from('proposal_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Research updated');
      return true;
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update research');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const loadReport = async (token: string): Promise<SavedReport | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_reports')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        token: data.token,
        communityName: data.community_name || '',
        communityAddress: data.community_address || '',
        units: data.units,
        sfOverride: data.sf_override,
        propertyClass: data.property_class || 'B',
        demographics: (data.demographics as SelectedDemographics) || {},
        compsRadius: data.comps_radius || 5,
        advancedOverrides: (data.advanced_overrides as AdvancedOverrides) || {},
        outputs: data.outputs as unknown as ProposalOutputs,
        multifamilyComps: (data.multifamily_comps as any[]) || [],
        fitnessComps: (data.fitness_comps as any[]) || [],
        mapCenter: data.map_center as { lat: number; lng: number } | null,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        dealId: data.deal_id,
        workspaceId: (data as any).workspace_id ?? null,
      };
    } catch (error) {
      console.error('Error loading report:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportByDealId = async (dealId: string): Promise<SavedReport | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_reports')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        token: data.token,
        communityName: data.community_name || '',
        communityAddress: data.community_address || '',
        units: data.units,
        sfOverride: data.sf_override,
        propertyClass: data.property_class || 'B',
        demographics: (data.demographics as SelectedDemographics) || {},
        compsRadius: data.comps_radius || 5,
        advancedOverrides: (data.advanced_overrides as AdvancedOverrides) || {},
        outputs: data.outputs as unknown as ProposalOutputs,
        multifamilyComps: (data.multifamily_comps as any[]) || [],
        fitnessComps: (data.fitness_comps as any[]) || [],
        mapCenter: data.map_center as { lat: number; lng: number } | null,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        dealId: data.deal_id,
        workspaceId: (data as any).workspace_id ?? null,
      };
    } catch (error) {
      console.error('Error loading report by deal ID:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveReport,
    updateReport,
    loadReport,
    loadReportByDealId,
    isSaving,
    isLoading,
    isUpdating
  };
}
