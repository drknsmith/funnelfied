import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PullLeadsParams {
  geography: string;
  verticals: string[];
  signalType: string;
  limit: number;
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
      const { data, error } = await supabase.functions.invoke<PullLeadsResponse>(
        'signal-miner',
        { body: params }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success && data?.error) {
        throw new Error(data.error);
      }

      return data as PullLeadsResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (data.leads.length > 0) {
        toast.success(data.message);
      } else {
        toast.info(data.message || 'No new leads found');
      }
    },
    onError: (error: Error) => {
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
