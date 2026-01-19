import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export type CalendarItemType = 'deal' | 'contact';

export interface CalendarItem {
  id: string;
  name: string;
  account_name: string;
  next_action: string | null;
  next_action_date: string;
  type: CalendarItemType;
  stage?: string;
  owner_user_id: string | null;
}

export interface CalendarItemsByDate {
  [date: string]: CalendarItem[];
}

export function useCalendarItems(currentDate: Date) {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  return useQuery({
    queryKey: ['calendar-items', workspaceId, format(currentDate, 'yyyy-MM'), viewMode, user?.id],
    queryFn: async () => {
      // Fetch deal follow-ups
      let dealsQuery = supabase
        .from('deals')
        .select('id, deal_name, next_action, next_action_date, stage, owner_user_id, accounts(name)')
        .not('next_action_date', 'is', null)
        .gte('next_action_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('next_action_date', format(monthEnd, 'yyyy-MM-dd'))
        .neq('status', 'won')
        .neq('status', 'lost')
        .order('next_action_date', { ascending: true });

      if (viewMode === 'my' && user?.id) {
        dealsQuery = dealsQuery.eq('owner_user_id', user.id);
      }

      // Fetch contact follow-ups
      let contactsQuery = supabase
        .from('contacts')
        .select('id, name, next_action, next_action_date, owner_user_id, accounts(name)')
        .not('next_action_date', 'is', null)
        .gte('next_action_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('next_action_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('next_action_date', { ascending: true });

      if (viewMode === 'my' && user?.id) {
        contactsQuery = contactsQuery.eq('owner_user_id', user.id);
      }

      const [dealsResult, contactsResult] = await Promise.all([
        dealsQuery,
        contactsQuery,
      ]);

      if (dealsResult.error) throw dealsResult.error;
      if (contactsResult.error) throw contactsResult.error;

      const itemsByDate: CalendarItemsByDate = {};

      // Process deals
      for (const deal of dealsResult.data || []) {
        const date = deal.next_action_date!;
        if (!itemsByDate[date]) {
          itemsByDate[date] = [];
        }
        itemsByDate[date].push({
          id: deal.id,
          name: deal.deal_name || (deal.accounts as any)?.name || 'Unknown Deal',
          account_name: (deal.accounts as any)?.name || 'Unknown',
          next_action: deal.next_action,
          next_action_date: deal.next_action_date!,
          type: 'deal',
          stage: deal.stage,
          owner_user_id: deal.owner_user_id,
        });
      }

      // Process contacts
      for (const contact of contactsResult.data || []) {
        const date = contact.next_action_date!;
        if (!itemsByDate[date]) {
          itemsByDate[date] = [];
        }
        itemsByDate[date].push({
          id: contact.id,
          name: contact.name,
          account_name: (contact.accounts as any)?.name || 'Unknown',
          next_action: contact.next_action,
          next_action_date: contact.next_action_date!,
          type: 'contact',
          owner_user_id: contact.owner_user_id,
        });
      }

      return itemsByDate;
    },
    enabled: !!workspaceId,
  });
}
