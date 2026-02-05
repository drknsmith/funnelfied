import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SMCampaign } from './useSMCampaigns';
import type { SMPlatform } from '@/lib/socialMediaConstants';

export function useSMCaptionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCaption = async ({
    platform,
    title,
    campaign,
  }: {
    platform: SMPlatform | SMPlatform[];
    title?: string;
    campaign?: SMCampaign | null;
  }): Promise<string | null> => {
    setIsGenerating(true);

    try {
      // Use first platform if array
      const platformStr = Array.isArray(platform) ? platform[0] : platform;

      const { data, error } = await supabase.functions.invoke('sm-caption-generator', {
        body: {
          platform: platformStr,
          title,
          campaign: campaign
            ? {
                name: campaign.name,
                description_brief: campaign.description_brief,
                do_dont_guidance: campaign.do_dont_guidance,
                default_cta_style: campaign.default_cta_style,
                keyword_tags: campaign.keyword_tags,
              }
            : null,
        },
      });

      if (error) throw error;

      if (data?.caption) {
        toast.success('Caption generated!');
        return data.caption;
      }

      return null;
    } catch (error: any) {
      console.error('Caption generation error:', error);
      if (error?.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again.');
      } else if (error?.message?.includes('Usage limit')) {
        toast.error('AI usage limit reached.');
      } else {
        toast.error('Failed to generate caption');
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateCaption, isGenerating };
}
