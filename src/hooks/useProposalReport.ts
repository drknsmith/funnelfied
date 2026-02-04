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

  const saveReport = async (
    data: ProposalReportData,
    expirationDays?: number
  ): Promise<{ token: string; url: string } | null> => {
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

      const { error } = await supabase
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
          expires_at: expiresAt
        });

      if (error) throw error;

      const url = `${window.location.origin}/superior/reports/${token}`;
      toast.success('Report saved! Link copied to clipboard.');
      
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard access may be denied
      }

      return { token, url };
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
      return null;
    } finally {
      setIsSaving(false);
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
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error loading report:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveReport,
    loadReport,
    isSaving,
    isLoading
  };
}
