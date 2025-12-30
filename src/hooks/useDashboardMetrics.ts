import { useMemo } from 'react';
import { useDeals, DealWithRelations } from './useDeals';
import { useAccounts, Account } from './useAccounts';
import { subDays, isToday, isBefore, startOfDay } from 'date-fns';

export interface DashboardMetrics {
  actionsToday: {
    count: number;
    deals: DealWithRelations[];
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
  const { deals, isLoading: dealsLoading } = useDeals();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    const fourteenDaysAgo = subDays(today, 14);

    // Actions Today: open deals with next_action_date <= today
    const actionsTodayDeals = deals.filter((d) => {
      if (d.status !== 'open' || !d.next_action_date) return false;
      const actionDate = startOfDay(new Date(d.next_action_date));
      return isBefore(actionDate, today) || isToday(new Date(d.next_action_date));
    });

    // High-Leverage: open deals with deal_type in ['portfolio', 'design_led']
    const highLeverageDeals = deals.filter(
      (d) => d.status === 'open' && ['portfolio', 'design_led'].includes(d.deal_type || '')
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
      actionsToday: { count: actionsTodayDeals.length, deals: actionsTodayDeals },
      highLeverage: { count: highLeverageDeals.length, deals: highLeverageDeals },
      stalled: { count: stalledDeals.length, deals: stalledDeals },
      expansionWatch: { count: expansionAccounts.length, accounts: expansionAccounts },
    };
  }, [deals, accounts]);

  return {
    ...metrics,
    isLoading: dealsLoading || accountsLoading,
  };
}
