import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SMPlatform, SlotStatus, RecurrenceRule } from '@/lib/socialMediaConstants';
import { addDays, addWeeks, startOfWeek } from 'date-fns';

/**
 * Format a Date object to YYYY-MM-DD string using local time components.
 * This avoids timezone issues that occur with toISOString() or date-fns format().
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the Nth occurrence of a specific weekday in a month.
 * For example: 2nd Thursday of January 2024.
 */
function getNthWeekdayOfMonth(
  baseDate: Date,
  monthOffset: number,
  dayOfWeek: number,  // 0-6 (Sun-Sat)
  weekOfMonth: number // 1-4
): Date | null {
  // Get the first day of the target month
  const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
  
  // Find first occurrence of the target day of week in that month
  let firstOccurrence = new Date(targetMonth);
  while (firstOccurrence.getDay() !== dayOfWeek) {
    firstOccurrence.setDate(firstOccurrence.getDate() + 1);
  }
  
  // Add weeks to get to the Nth occurrence
  const targetDate = new Date(firstOccurrence);
  targetDate.setDate(targetDate.getDate() + (weekOfMonth - 1) * 7);
  
  // Verify it's still in the same month (Week 4 might overflow in short months)
  if (targetDate.getMonth() !== targetMonth.getMonth()) {
    return null;
  }
  
  return targetDate;
}

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
  const { workspaceId } = useAuth();
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['sm-schedule-slots', workspaceId, dateRange],
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
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateSlotInput) => {
      if (!workspaceId) {
        throw new Error('Workspace not loaded. Please refresh the page.');
      }
      
      const { data, error } = await supabase
        .from('sm_schedule_slots')
        .insert({
          workspace_id: workspaceId,
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
    onError: (error: any) => {
      console.error('Error creating slot:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to create schedule slot');
      }
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
        .update(updates as never)
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
    onError: (error: any) => {
      console.error('Error updating slot:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to update schedule slot');
      }
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
    onError: (error: any) => {
      console.error('Error deleting slot:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to delete schedule slot');
      }
    },
  });

  // Generate slots for a campaign based on recurrence rule
  const generateSlotsForCampaign = async (
    campaignId: string,
    platforms: SMPlatform[],
    recurrenceRule: RecurrenceRule,
    periodsAhead: number = 12
  ) => {
    if (!workspaceId) {
      throw new Error('Workspace not loaded. Please refresh the page.');
    }
    
    const slots: CreateSlotInput[] = [];
    const today = new Date();
    
    if (recurrenceRule.frequency === 'monthly') {
      // Monthly: Find the Nth occurrence of day_of_week in each month
      for (let monthOffset = 0; monthOffset < periodsAhead; monthOffset++) {
        const targetDate = getNthWeekdayOfMonth(
          today,
          monthOffset,
          recurrenceRule.day_of_week,
          recurrenceRule.week_of_month || 1
        );
        
        if (targetDate) {
          const dateStr = toLocalDateString(targetDate);
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
    } else {
      // Weekly, biweekly, or custom
      const weekStart = startOfWeek(today);
      
      for (let week = 0; week < periodsAhead; week++) {
        const shouldSchedule = 
          recurrenceRule.frequency === 'weekly' ||
          (recurrenceRule.frequency === 'biweekly' && week % 2 === 0) ||
          (recurrenceRule.frequency === 'custom' && recurrenceRule.custom_days?.includes(week));
        
        if (shouldSchedule) {
          const slotDate = addDays(addWeeks(weekStart, week), recurrenceRule.day_of_week);
          const dateStr = toLocalDateString(slotDate);
          
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
    }
    
    // Batch insert slots
    if (slots.length > 0) {
      const { error } = await supabase
        .from('sm_schedule_slots')
        .insert(
          slots.map(s => ({
            ...s,
            workspace_id: workspaceId,
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
