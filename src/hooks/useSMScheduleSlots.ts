import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SMPlatform, SlotStatus, RecurrenceRule } from '@/lib/socialMediaConstants';
import { addDays, addWeeks, startOfWeek, format } from 'date-fns';

export interface SMScheduleSlot {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  scheduled_date: string;
  platform: SMPlatform;
  status: SlotStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateSlotInput {
  campaign_id?: string;
  scheduled_date: string;
  platform: SMPlatform;
  status?: SlotStatus;
}

export function useSMScheduleSlots(dateRange?: { start: string; end: string }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['sm-schedule-slots', profile?.workspace_id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('sm_schedule_slots')
        .select('*')
        .order('scheduled_date');
      
      if (dateRange) {
        query = query
          .gte('scheduled_date', dateRange.start)
          .lte('scheduled_date', dateRange.end);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(s => ({
        ...s,
        platform: s.platform as SMPlatform,
        status: s.status as SlotStatus,
      })) as SMScheduleSlot[];
    },
    enabled: !!profile?.workspace_id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateSlotInput) => {
      const { data, error } = await supabase
        .from('sm_schedule_slots')
        .insert({
          workspace_id: profile!.workspace_id,
          campaign_id: input.campaign_id || null,
          scheduled_date: input.scheduled_date,
          platform: input.platform,
          status: input.status || 'planned',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-schedule-slots'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
    },
    onError: (error) => {
      console.error('Error creating slot:', error);
      toast.error('Failed to create schedule slot');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateSlotInput> & { id: string }) => {
      const updates: Record<string, unknown> = {};
      if (input.campaign_id !== undefined) updates.campaign_id = input.campaign_id || null;
      if (input.scheduled_date !== undefined) updates.scheduled_date = input.scheduled_date;
      if (input.platform !== undefined) updates.platform = input.platform;
      if (input.status !== undefined) updates.status = input.status;

      const { data, error } = await supabase
        .from('sm_schedule_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-schedule-slots'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
    },
    onError: (error) => {
      console.error('Error updating slot:', error);
      toast.error('Failed to update schedule slot');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sm_schedule_slots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-schedule-slots'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
    },
    onError: (error) => {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete schedule slot');
    },
  });

  // Generate slots for a campaign based on recurrence rule
  const generateSlotsForCampaign = async (
    campaignId: string,
    platforms: SMPlatform[],
    recurrenceRule: RecurrenceRule,
    weeksAhead: number = 12
  ) => {
    const slots: CreateSlotInput[] = [];
    const today = new Date();
    const weekStart = startOfWeek(today);
    
    for (let week = 0; week < weeksAhead; week++) {
      // Determine if this week should have a slot based on frequency
      const shouldSchedule = 
        recurrenceRule.frequency === 'weekly' ||
        (recurrenceRule.frequency === 'biweekly' && week % 2 === 0) ||
        (recurrenceRule.frequency === 'custom' && recurrenceRule.custom_days?.includes(week));
      
      if (shouldSchedule) {
        const slotDate = addDays(addWeeks(weekStart, week), recurrenceRule.day_of_week);
        const dateStr = format(slotDate, 'yyyy-MM-dd');
        
        // Create a slot for each platform
        for (const platform of platforms) {
          slots.push({
            campaign_id: campaignId,
            scheduled_date: dateStr,
            platform,
            status: 'planned',
          });
        }
      }
    }
    
    // Batch insert slots
    if (slots.length > 0) {
      const { error } = await supabase
        .from('sm_schedule_slots')
        .insert(
          slots.map(s => ({
            ...s,
            workspace_id: profile!.workspace_id,
          }))
        );
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['sm-schedule-slots'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
    }
    
    return slots.length;
  };

  return {
    slots,
    isLoading,
    createSlot: createMutation.mutateAsync,
    updateSlot: updateMutation.mutateAsync,
    deleteSlot: deleteMutation.mutateAsync,
    generateSlotsForCampaign,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
