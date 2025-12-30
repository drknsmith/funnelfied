import AppLayout from '@/components/layout/AppLayout';
import { useDeals, DEAL_STAGES } from '@/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Deals() {
  const navigate = useNavigate();
  const { deals, isLoading, updateDeal } = useDeals();

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => d.stage === stage.value),
  }));

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
            <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground">{deals.length} deals in pipeline</p>
          </div>
          <Button onClick={() => navigate('/deals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        {deals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Handshake className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No deals yet</p>
              <p className="mb-4 text-muted-foreground">Create your first deal to get started</p>
              <Button onClick={() => navigate('/deals/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Deal
              </Button>
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
                        <p className="font-medium text-sm">{deal.accounts?.name || 'No account'}</p>
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