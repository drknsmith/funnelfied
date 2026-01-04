import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PullLeadsParams {
  geography: string;
  verticals: string[];
  signalType: string;
  limit: number;
  searchContext?: string;
}

interface PullLeadsResponse {
  success: boolean;
  leads: string[];
  message: string;
  error?: string;
}

export function usePullLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PullLeadsParams): Promise<PullLeadsResponse> => {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      try {
        const { data, error } = await supabase.functions.invoke<PullLeadsResponse>(
          'signal-miner',
          { body: params }
        );

        clearTimeout(timeoutId);

        if (error) {
          throw new Error(error.message);
        }

        if (!data?.success && data?.error) {
          throw new Error(data.error);
        }

        return data as PullLeadsResponse;
      } catch (err) {
        clearTimeout(timeoutId);
        
        // If request timed out but may have created leads, force refresh
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request timed out, refreshing leads list anyway');
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          return {
            success: true,
            leads: [],
            message: 'Request took too long. Leads may have been created - please refresh.',
          };
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      // Always invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      if (data.leads.length > 0) {
        toast.success(data.message);
      } else if (data.message.includes('took too long')) {
        toast.info(data.message);
      } else {
        toast.info(data.message || 'No new leads found');
      }
    },
    onError: (error: Error) => {
      // Force refresh in case leads were created before error
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      // Handle specific error types
      if (error.message.includes('Rate limit')) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.message.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(`Failed to pull leads: ${error.message}`);
      }
    },
  });
}
