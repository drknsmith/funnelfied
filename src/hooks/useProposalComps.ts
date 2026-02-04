import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MultifamilyComp {
  name: string;
  address: string;
  distance: number;
  inferredClass: string;
  classConfidence: string;
  amenitySignals: string[];
  lat?: number;
  lng?: number;
}

export interface FitnessComp {
  name: string;
  address: string;
  distance: number;
  type: string;
  focusTags: string[];
  complementGuidance: string[];
  lat?: number;
  lng?: number;
}

export interface CompsResult {
  multifamilyComps: MultifamilyComp[];
  fitnessComps: FitnessComp[];
  mapCenter: { lat: number; lng: number };
}

export function useProposalComps() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComps = async (
    address: string,
    radiusMiles: number
  ): Promise<CompsResult | null> => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('proposal-comps', {
        body: { address, radiusMiles }
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch comps');
      }

      return {
        multifamilyComps: data.multifamilyComps || [],
        fitnessComps: data.fitnessComps || [],
        mapCenter: data.mapCenter
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch competitive analysis';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchComps,
    isLoading,
    error
  };
}
