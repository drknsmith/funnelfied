import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['leads-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, company, project_name, location, health_score, lat, lng, status, facility_type')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching leads for map:', error);
        throw error;
      }

      return data as MapLead[];
    },
  });
}

export function useAccountsForMap() {
  return useQuery({
    queryKey: ['accounts-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, health_score, lat, lng, status, segment')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching accounts for map:', error);
        throw error;
      }

      return data as MapAccount[];
    },
  });
}

export function useTrainersForMap() {
  return useQuery({
    queryKey: ['trainers-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('id, name, career_health_score, lat, lng, account_id')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching trainers for map:', error);
        throw error;
      }

      return data as MapTrainer[];
    },
  });
}
