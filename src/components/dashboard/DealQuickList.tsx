import { useNavigate } from 'react-router-dom';
import { DealWithRelations } from '@/hooks/useDeals';
import { format, differenceInDays } from 'date-fns';

interface DealQuickListProps {
  deals: DealWithRelations[];
  type: 'actions' | 'stalled' | 'high-leverage';
  maxItems?: number;
}

export default function DealQuickList({ deals, type, maxItems = 5 }: DealQuickListProps) {
  const navigate = useNavigate();
  const displayDeals = deals.slice(0, maxItems);

  const getSecondaryInfo = (deal: DealWithRelations) => {
    switch (type) {
      case 'actions':
        return deal.next_action_date
          ? `Due: ${format(new Date(deal.next_action_date), 'MMM d')}`
          : '';
      case 'stalled':
        if (!deal.last_meaningful_activity_date) return 'No activity recorded';
        const days = differenceInDays(new Date(), new Date(deal.last_meaningful_activity_date));
        return `${days} days since activity`;
      case 'high-leverage':
        return deal.deal_type === 'portfolio' ? 'Portfolio' : 'Design-Led';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-1">
      {displayDeals.map((deal) => (
        <div
          key={deal.id}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deals/${deal.id}`);
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{deal.deal_name || deal.accounts?.name || 'Untitled Opportunity'}</p>
            {deal.deal_name && deal.accounts?.name && (
              <p className="text-[11px] text-muted-foreground truncate">{deal.accounts.name}</p>
            )}
            <p className="text-xs text-muted-foreground">{deal.deal_size_range || '-'}</p>
          </div>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            {getSecondaryInfo(deal)}
          </span>
        </div>
      ))}
    </div>
  );
}
