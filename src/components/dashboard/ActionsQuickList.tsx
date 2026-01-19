import { useNavigate } from 'react-router-dom';
import { ActionItem } from '@/hooks/useDashboardMetrics';
import { format } from 'date-fns';
import { User, Briefcase } from 'lucide-react';

interface ActionsQuickListProps {
  items: ActionItem[];
  maxItems?: number;
}

export default function ActionsQuickList({ items, maxItems = 5 }: ActionsQuickListProps) {
  const navigate = useNavigate();
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayItems.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            navigate(item.type === 'contact' ? `/contacts/${item.id}` : `/deals/${item.id}`);
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {item.type === 'contact' ? (
              <User className="h-4 w-4 text-purple-500 shrink-0" />
            ) : (
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              {item.account_name && (
                <p className="text-[11px] text-muted-foreground truncate">{item.account_name}</p>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground ml-2 shrink-0">
            Due: {format(new Date(item.next_action_date), 'MMM d')}
          </span>
        </div>
      ))}
    </div>
  );
}
