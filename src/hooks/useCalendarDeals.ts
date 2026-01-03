import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface CalendarDeal {
  id: string;
  deal_name: string | null;
  account_name: string;
  next_action: string | null;
  next_action_date: string;
  stage: string;
  owner_user_id: string | null;
}

export interface CalendarDealsByDate {
  [date: string]: CalendarDeal[];
}

export function useCalendarDeals(currentDate: Date) {
  const { profile, user } = useAuth();
  const { viewMode } = useViewMode();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  return useQuery({
    queryKey: ['calendar-deals', profile?.workspace_id, format(currentDate, 'yyyy-MM'), viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select('id, deal_name, next_action, next_action_date, stage, owner_user_id, accounts(name)')
        .not('next_action_date', 'is', null)
        .gte('next_action_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('next_action_date', format(monthEnd, 'yyyy-MM-dd'))
        .neq('status', 'won')
        .neq('status', 'lost')
        .order('next_action_date', { ascending: true });

      if (viewMode === 'my' && user?.id) {
        query = query.eq('owner_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const dealsByDate: CalendarDealsByDate = {};
      
      for (const deal of data || []) {
        const date = deal.next_action_date;
        if (!dealsByDate[date]) {
          dealsByDate[date] = [];
        }
        dealsByDate[date].push({
          id: deal.id,
          deal_name: deal.deal_name,
          account_name: (deal.accounts as any)?.name || 'Unknown',
          next_action: deal.next_action,
          next_action_date: deal.next_action_date,
          stage: deal.stage,
          owner_user_id: deal.owner_user_id,
        });
      }

      return dealsByDate;
    },
    enabled: !!profile?.workspace_id,
  });
}
