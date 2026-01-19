import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Loader2, Calendar, TrendingUp, Clock, Building2 } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import MetricCard from '@/components/dashboard/MetricCard';
import DealQuickList from '@/components/dashboard/DealQuickList';
import ActionsQuickList from '@/components/dashboard/ActionsQuickList';
import AccountQuickList from '@/components/dashboard/AccountQuickList';

type ExpandedCard = 'actions' | 'high-leverage' | 'stalled' | 'expansion' | null;

export default function Index() {
  const { loading, profile } = useAuth();
  const navigate = useNavigate();
  const metrics = useDashboardMetrics();
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleCard = (card: ExpandedCard) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground">Here's your sales pipeline overview.</p>
        </div>

        {metrics.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Actions Today"
              description="Deals & contacts needing attention"
              count={metrics.actionsToday.count}
              icon={Calendar}
              variant="warning"
              isExpanded={expandedCard === 'actions'}
              onToggle={() => toggleCard('actions')}
              onViewAll={() => navigate('/deals?filter=actions-today')}
            >
              <ActionsQuickList items={metrics.actionsToday.items} />
            </MetricCard>

            <MetricCard
              title="High-Leverage"
              description="Portfolio & design-led deals"
              count={metrics.highLeverage.count}
              icon={TrendingUp}
              variant="default"
              isExpanded={expandedCard === 'high-leverage'}
              onToggle={() => toggleCard('high-leverage')}
              onViewAll={() => navigate('/deals?filter=high-leverage')}
            >
              <DealQuickList deals={metrics.highLeverage.deals} type="high-leverage" />
            </MetricCard>

            <MetricCard
              title="Stalled Deals"
              description="No activity in 14+ days"
              count={metrics.stalled.count}
              icon={Clock}
              variant="danger"
              isExpanded={expandedCard === 'stalled'}
              onToggle={() => toggleCard('stalled')}
              onViewAll={() => navigate('/deals?filter=stalled')}
            >
              <DealQuickList deals={metrics.stalled.deals} type="stalled" />
            </MetricCard>

            <MetricCard
              title="Expansion Watch"
              description="Multi-site opportunities"
              count={metrics.expansionWatch.count}
              icon={Building2}
              variant="success"
              isExpanded={expandedCard === 'expansion'}
              onToggle={() => toggleCard('expansion')}
              onViewAll={() => navigate('/accounts?filter=expansion')}
            >
              <AccountQuickList accounts={metrics.expansionWatch.accounts} />
            </MetricCard>
          </div>
        )}

        {!metrics.isLoading && metrics.actionsToday.count === 0 && 
         metrics.highLeverage.count === 0 && 
         metrics.stalled.count === 0 && 
         metrics.expansionWatch.count === 0 && (
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Your dashboard will populate as you add deals, accounts, and interactions.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
