import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLATFORM_ORDER, type SMPlatform, type SlotStatus, type ContentStatus } from '@/lib/socialMediaConstants';

export interface CalendarDayData {
  date: string;
  platforms: {
    [key in SMPlatform]: {
      hasSlot: boolean;        // Slot exists (scheduled placeholder)
      hasContent: boolean;     // Actual content item linked
      campaignId: string | null;
      campaignColor: string | null;
      campaignName: string | null;
      contentCount: number;
      slotStatus: SlotStatus | null;
    };
  };
}

export interface CalendarContentItem {
  id: string;
  platform: SMPlatform;
  title: string | null;
  caption: string | null;
  status: ContentStatus;
  campaignId: string | null;
  campaignName: string | null;
  campaignColor: string | null;
  thumbnailUrl: string | null;
  effectiveDate: string;
}

export function useSMCalendarData(dateRange: { start: string; end: string }) {
  const { workspaceId } = useAuth();

  return useQuery({
    queryKey: ['sm-calendar-data', workspaceId, dateRange],
    queryFn: async () => {
      // Fetch campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('sm_campaigns')
        .select('id, name, color, platforms, is_active');
      
      if (campaignsError) throw campaignsError;
      
      const campaignMap = new Map(campaigns?.map(c => [c.id, c]) || []);
      
      // Fetch schedule slots in range
      const { data: slots, error: slotsError } = await supabase
        .from('sm_schedule_slots')
        .select('*')
        .gte('scheduled_date', dateRange.start)
        .lte('scheduled_date', dateRange.end);
      
      if (slotsError) throw slotsError;
      
      // Fetch content items with assets
      const { data: contentItems, error: contentError } = await supabase
        .from('sm_content_items')
        .select(`
          *,
          sm_content_assets (
            display_order,
            sm_assets (
              thumbnail_url
            )
          )
        `);
      
      if (contentError) throw contentError;
      
      // Build calendar data by date
      const calendarData: Map<string, CalendarDayData> = new Map();
      const contentByDate: Map<string, CalendarContentItem[]> = new Map();
      
      // Initialize empty platform data
      const emptyPlatformData = () => 
        Object.fromEntries(
          PLATFORM_ORDER.map(p => [p, {
            hasSlot: false,
            hasContent: false,
            campaignId: null,
            campaignColor: null,
            campaignName: null,
            contentCount: 0,
            slotStatus: null,
          }])
        ) as CalendarDayData['platforms'];
      
      // Process slots
      for (const slot of slots || []) {
        const dateStr = slot.scheduled_date;
        
        if (!calendarData.has(dateStr)) {
          calendarData.set(dateStr, {
            date: dateStr,
            platforms: emptyPlatformData(),
          });
        }
        
        const dayData = calendarData.get(dateStr)!;
        const platform = slot.platform as SMPlatform;
        const campaign = slot.campaign_id ? campaignMap.get(slot.campaign_id) : null;
        
        dayData.platforms[platform] = {
          hasSlot: true,           // Slot exists
          hasContent: false,       // No content yet (will be updated if content exists)
          campaignId: slot.campaign_id,
          campaignColor: campaign?.color || null,
          campaignName: campaign?.name || null,
          contentCount: 0,
          slotStatus: slot.status as SlotStatus,
        };
      }
      
      // Process content items
      for (const item of contentItems || []) {
        // Determine effective date (override_date or from linked slot)
        let effectiveDate: string | null = item.override_date;
        
        if (!effectiveDate && item.schedule_slot_id) {
          const slot = (slots || []).find(s => s.id === item.schedule_slot_id);
          effectiveDate = slot?.scheduled_date || null;
        }
        
        if (!effectiveDate) continue;
        
        const campaign = item.campaign_id ? campaignMap.get(item.campaign_id) : null;
        const thumbnail = (item.sm_content_assets as any[])?.[0]?.sm_assets?.thumbnail_url || null;
        
        const calendarItem: CalendarContentItem = {
          id: item.id,
          platform: item.platform as SMPlatform,
          title: item.title,
          caption: item.caption,
          status: item.status as ContentStatus,
          campaignId: item.campaign_id,
          campaignName: campaign?.name || null,
          campaignColor: campaign?.color || null,
          thumbnailUrl: thumbnail,
          effectiveDate,
        };
        
        if (!contentByDate.has(effectiveDate)) {
          contentByDate.set(effectiveDate, []);
        }
        contentByDate.get(effectiveDate)!.push(calendarItem);
        
        // Update calendar data with content count
        if (!calendarData.has(effectiveDate)) {
          calendarData.set(effectiveDate, {
            date: effectiveDate,
            platforms: emptyPlatformData(),
          });
        }
        
        const dayData = calendarData.get(effectiveDate)!;
        const platform = item.platform as SMPlatform;
        
        dayData.platforms[platform].hasSlot = true;    // Mark slot as existing
        dayData.platforms[platform].hasContent = true; // Actual content exists
        dayData.platforms[platform].contentCount++;
        
        if (campaign && !dayData.platforms[platform].campaignId) {
          dayData.platforms[platform].campaignId = campaign.id;
          dayData.platforms[platform].campaignColor = campaign.color;
          dayData.platforms[platform].campaignName = campaign.name;
        }
      }
      
      return {
        calendarData: Object.fromEntries(calendarData),
        contentByDate: Object.fromEntries(contentByDate),
        campaigns: campaigns || [],
      };
    },
    enabled: !!workspaceId && !!dateRange.start && !!dateRange.end,
  });
}
