import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useDeals, DEAL_STAGES, DealWithRelations } from '@/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Handshake, X } from 'lucide-react';
import { subDays, startOfDay, isBefore, isToday } from 'date-fns';

const FILTER_LABELS: Record<string, string> = {
  'actions-today': 'Actions Today',
  'high-leverage': 'High-Leverage',
  'stalled': 'Stalled Deals',
};

export default function Deals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { deals, isLoading } = useDeals();
  
  const filter = searchParams.get('filter');

  const filteredDeals = useMemo(() => {
    if (!filter) return deals;

    const today = startOfDay(new Date());
    const fourteenDaysAgo = subDays(today, 14);

    switch (filter) {
      case 'actions-today':
        return deals.filter((d) => {
          if (d.status !== 'open' || !d.next_action_date) return false;
          const actionDate = startOfDay(new Date(d.next_action_date));
          return isBefore(actionDate, today) || isToday(new Date(d.next_action_date));
        });
      case 'high-leverage':
        return deals.filter(
          (d) => d.status === 'open' && ['portfolio', 'design_led'].includes(d.deal_type || '')
        );
      case 'stalled':
        return deals.filter((d) => {
          if (d.status !== 'open') return false;
          if (!d.last_meaningful_activity_date) return true;
          const activityDate = startOfDay(new Date(d.last_meaningful_activity_date));
          return isBefore(activityDate, fourteenDaysAgo);
        });
      default:
        return deals;
    }
  }, [deals, filter]);

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    ...stage,
    deals: filteredDeals.filter((d) => d.stage === stage.value),
  }));

  const clearFilter = () => {
    setSearchParams({});
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
              {filter && FILTER_LABELS[filter] && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {FILTER_LABELS[filter]}
                  <button onClick={clearFilter} className="ml-1 hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''} 
              {filter ? ' matching filter' : ' in pipeline'}
            </p>
          </div>
          <Button onClick={() => navigate('/deals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        {filteredDeals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Handshake className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">
                {filter ? 'No deals match this filter' : 'No deals yet'}
              </p>
              <p className="mb-4 text-muted-foreground">
                {filter ? 'Try clearing the filter or create a new deal' : 'Create your first deal to get started'}
              </p>
              <div className="flex gap-2">
                {filter && (
                  <Button variant="outline" onClick={clearFilter}>
                    Clear Filter
                  </Button>
                )}
                <Button onClick={() => navigate('/deals/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {dealsByStage.map((stage) => (
              <div key={stage.value} className="flex-shrink-0 w-72">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{stage.label}</h3>
                  <Badge variant="secondary">{stage.deals.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px] rounded-lg bg-muted/30 p-2">
                  {stage.deals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{deal.deal_name || deal.accounts?.name || 'Untitled Deal'}</p>
                        {deal.deal_name && deal.accounts?.name && (
                          <p className="text-xs text-muted-foreground">{deal.accounts.name}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{deal.deal_size_range || '-'}</span>
                          <span>{deal.probability || 0}%</span>
                        </div>
                        {deal.next_action && (
                          <p className="mt-2 text-xs text-muted-foreground truncate">{deal.next_action}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
