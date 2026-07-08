import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeals, DealWithRelations } from './useDeals';
import { useAccounts, Account } from './useAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { subDays, isToday, isBefore, startOfDay } from 'date-fns';

export type ActionItem = {
  id: string;
  name: string;
  account_name: string | null;
  next_action_date: string;
  type: 'deal' | 'contact';
};

export interface DashboardMetrics {
  actionsToday: {
    count: number;
    items: ActionItem[];
  };
  highLeverage: {
    count: number;
    deals: DealWithRelations[];
  };
  stalled: {
    count: number;
    deals: DealWithRelations[];
  };
  expansionWatch: {
    count: number;
    accounts: (Account & { openDealCount: number })[];
  };
  isLoading: boolean;
}

export function useDashboardMetrics(): DashboardMetrics {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();
  const { deals, isLoading: dealsLoading } = useDeals();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  // Query contacts directly instead of using useContacts hook (avoids hooks complexity)
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['dashboard-contacts', workspaceId, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('id, name, next_action, next_action_date, owner_user_id, accounts(name)')
        .not('next_action_date', 'is', null);

      if (viewMode === 'my' && user?.id) {
        query = query.eq('owner_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    const fourteenDaysAgo = subDays(today, 14);

    // Actions Today: open deals with next_action_date <= today
    const actionsTodayDeals = deals.filter((d) => {
      if (d.status !== 'open' || !d.next_action_date) return false;
      const actionDate = startOfDay(new Date(d.next_action_date));
      return isBefore(actionDate, today) || isToday(new Date(d.next_action_date));
    });

    // Contact follow-ups due today
    const actionsTodayContacts = contacts.filter((c) => {
      if (!c.next_action_date) return false;
      const actionDate = startOfDay(new Date(c.next_action_date));
      return isBefore(actionDate, today) || isToday(new Date(c.next_action_date));
    });

    // Combine into action items
    const actionItems: ActionItem[] = [
      ...actionsTodayDeals.map((d) => ({
        id: d.id,
        name: d.deal_name || d.accounts?.name || 'Untitled Deal',
        account_name: d.accounts?.name || null,
        next_action_date: d.next_action_date!,
        type: 'deal' as const,
      })),
      ...actionsTodayContacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        account_name: c.accounts?.name || null,
        next_action_date: c.next_action_date!,
        type: 'contact' as const,
      })),
    ];

    // High-Leverage: open deals with deal_type in ['portfolio', 'design_led']
    const highLeverageDeals = deals.filter(
      (d) => d.status === 'open' && (d.deal_type ?? []).some((t) => ['portfolio', 'design_led'].includes(t))
    );

    // Stalled: open deals with no last_meaningful_activity_date OR activity > 14 days ago
    const stalledDeals = deals.filter((d) => {
      if (d.status !== 'open') return false;
      if (!d.last_meaningful_activity_date) return true;
      const activityDate = startOfDay(new Date(d.last_meaningful_activity_date));
      return isBefore(activityDate, fourteenDaysAgo);
    });

    // Expansion Watch: accounts with portfolio_size > 1 that have open deals
    const openDealsByAccount = new Map<string, number>();
    deals
      .filter((d) => d.status === 'open')
      .forEach((d) => {
        const count = openDealsByAccount.get(d.account_id) || 0;
        openDealsByAccount.set(d.account_id, count + 1);
      });

    const expansionAccounts = accounts
      .filter((a) => {
        const portfolioSize = parseInt(a.portfolio_size) || 1;
        return portfolioSize > 1 && openDealsByAccount.has(a.id);
      })
      .map((a) => ({
        ...a,
        openDealCount: openDealsByAccount.get(a.id) || 0,
      }));

    return {
      actionsToday: { count: actionItems.length, items: actionItems },
      highLeverage: { count: highLeverageDeals.length, deals: highLeverageDeals },
      stalled: { count: stalledDeals.length, deals: stalledDeals },
      expansionWatch: { count: expansionAccounts.length, accounts: expansionAccounts },
    };
  }, [deals, accounts, contacts]);

  return {
    ...metrics,
    isLoading: dealsLoading || accountsLoading || contactsLoading,
  };
}
