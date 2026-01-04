import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Trainer {
  id: string;
  workspace_id: string;
  account_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  lat: number | null;
  lng: number | null;
  career_health_score: number | null;
  career_mentions: string | null;
  source_links: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useTrainers(accountId?: string) {
  return useQuery({
    queryKey: ['trainers', accountId],
    queryFn: async () => {
      let query = supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trainers:', error);
        throw error;
      }

      return data as Trainer[];
    },
    enabled: true,
  });
}

export function useTrainersForMap() {
  return useQuery({
    queryKey: ['trainers-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('id, name, lat, lng, career_health_score, account_id')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching trainers for map:', error);
        throw error;
      }

      return data as Pick<Trainer, 'id' | 'name' | 'lat' | 'lng' | 'career_health_score' | 'account_id'>[];
    },
  });
}

export function usePullTrainers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId }: { accountId: string }) => {
      const { data, error } = await supabase.functions.invoke('trainer-miner', {
        body: { accountId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success && data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainers', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['trainers-map'] });
      if (data.trainers?.length > 0) {
        toast.success(data.message || `Found ${data.trainers.length} trainers`);
      } else {
        toast.info(data.message || 'No trainers found in the area');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.message.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(`Failed to pull trainers: ${error.message}`);
      }
    },
  });
}
