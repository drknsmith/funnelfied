import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Default stages used by most workspaces
export const DEFAULT_DEAL_STAGES = [
  { value: 'signal_target', label: 'Signal / Target' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'sow', label: 'SOW' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
] as const;

export type DealStage = {
  value: string;
  label: string;
};

export function usePipelineStages() {
  const { activeWorkspaceId } = useAuth();

  const { data: customStages, isLoading } = useQuery({
    queryKey: ['pipeline-stages', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_pipeline_stages')
        .select('stages')
        .eq('workspace_id', activeWorkspaceId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        return [];
      }

      return (data?.stages as DealStage[]) || [];
    },
    enabled: !!activeWorkspaceId,
  });

  // Use custom stages if available, otherwise use defaults
  const stages: DealStage[] = customStages?.length ? customStages : [...DEFAULT_DEAL_STAGES];

  return {
    stages,
    isLoading,
    hasCustomStages: !!customStages,
  };
}
