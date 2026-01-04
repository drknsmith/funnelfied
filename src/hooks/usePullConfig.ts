import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PullConfig {
  id: string;
  workspace_id: string;
  name: string;
  verticals: string[];
  signal_types: string[];
  search_context: string | null;
  is_active: boolean;
}

export function usePullConfig() {
  return useQuery({
    queryKey: ['pull-config'],
    queryFn: async (): Promise<PullConfig | null> => {
      const { data, error } = await supabase
        .from('workspace_pull_configs')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching pull config:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        workspace_id: data.workspace_id,
        name: data.name,
        verticals: (data.verticals as string[]) || [],
        signal_types: (data.signal_types as string[]) || [],
        search_context: data.search_context,
        is_active: data.is_active,
      };
    },
  });
}
