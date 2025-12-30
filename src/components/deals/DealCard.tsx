import { DealWithRelations, DEAL_SIZES } from '@/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isAfter, isBefore, addDays, parseISO, startOfDay } from 'date-fns';

interface DealCardProps {
  deal: DealWithRelations;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, deal: DealWithRelations) => void;
  isDragging?: boolean;
}

function getNextActionDateStatus(nextActionDate: string | null): 'overdue' | 'soon' | 'normal' | null {
  if (!nextActionDate) return null;
  
  try {
    const date = parseISO(nextActionDate);
    const today = startOfDay(new Date());
    const threeDaysFromNow = addDays(today, 3);
    
    if (isBefore(date, today)) {
      return 'overdue';
    } else if (isBefore(date, threeDaysFromNow)) {
      return 'soon';
    }
    return 'normal';
  } catch {
    return null;
  }
}

function getProbabilityVariant(probability: number | null): 'default' | 'secondary' | 'destructive' {
  if (!probability || probability < 30) return 'destructive';
  if (probability < 60) return 'secondary';
  return 'default';
}

export default function DealCard({ deal, onClick, onDragStart, isDragging }: DealCardProps) {
  const sizeLabel = DEAL_SIZES.find((s) => s.value === deal.deal_size_range)?.label || deal.deal_size_range;
  const dateStatus = getNextActionDateStatus(deal.next_action_date);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={onClick}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm flex-1">{deal.accounts?.name || 'No account'}</p>
          {deal.playbooks && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-primary/5">
              {deal.playbooks.name}
            </Badge>
          )}
        </div>
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{sizeLabel || '-'}</span>
          <Badge 
            variant={getProbabilityVariant(deal.probability)}
            className="text-[10px] px-1.5 py-0"
          >
            {deal.probability || 0}%
          </Badge>
          {dateStatus && (
            <Badge 
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0',
                dateStatus === 'overdue' && 'border-destructive text-destructive',
                dateStatus === 'soon' && 'border-yellow-500 text-yellow-600'
              )}
            >
              {dateStatus === 'overdue' ? 'Overdue' : dateStatus === 'soon' ? 'Due Soon' : ''}
            </Badge>
          )}
        </div>
        
        {deal.next_action && (
          <p className="mt-2 text-xs text-muted-foreground truncate">{deal.next_action}</p>
        )}
      </CardContent>
    </Card>
  );
}
