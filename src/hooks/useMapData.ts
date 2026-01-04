import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MapLead {
  id: string;
  company: string;
  project_name: string;
  location: string;
  health_score: number | null;
  lat: number | null;
  lng: number | null;
  status: string;
  facility_type: string | null;
}

export interface MapAccount {
  id: string;
  name: string;
  health_score: number | null;
  lat: number | null;
  lng: number | null;
  status: string;
  segment: string | null;
  location: string | null;
}

export interface MapTrainer {
  id: string;
  name: string;
  career_health_score: number | null;
  lat: number | null;
  lng: number | null;
  account_id: string | null;
}

export function useLeadsForMap() {
  const { workspaceId } = useAuth();
  
  return useQuery({
    queryKey: ['leads-map', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, company, project_name, location, health_score, lat, lng, status, facility_type')
        .eq('workspace_id', workspaceId)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching leads for map:', error);
        throw error;
      }

      return data as MapLead[];
    },
    enabled: !!workspaceId,
  });
}

export function useAccountsForMap() {
  const { workspaceId } = useAuth();
  
  return useQuery({
    queryKey: ['accounts-map', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      // Fetch all accounts - those with coordinates AND those with just location text
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, health_score, lat, lng, status, segment, location')
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error fetching accounts for map:', error);
        throw error;
      }

      // Filter to only include accounts that have coordinates
      const accountsWithCoords = (data || []).filter(a => a.lat !== null && a.lng !== null);

      return accountsWithCoords as MapAccount[];
    },
    enabled: !!workspaceId,
  });
}

export function useTrainersForMap() {
  const { workspaceId } = useAuth();
  
  return useQuery({
    queryKey: ['trainers-map', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('trainers')
        .select('id, name, career_health_score, lat, lng, account_id')
        .eq('workspace_id', workspaceId)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching trainers for map:', error);
        throw error;
      }

      return data as MapTrainer[];
    },
    enabled: !!workspaceId,
  });
}
