import { DealWithRelations, DEAL_SIZES } from '@/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: DealWithRelations;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, deal: DealWithRelations) => void;
  isDragging?: boolean;
}

export default function DealCard({ deal, onClick, onDragStart, isDragging }: DealCardProps) {
  const sizeLabel = DEAL_SIZES.find((s) => s.value === deal.deal_size_range)?.label || deal.deal_size_range;

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
        <p className="font-medium text-sm">{deal.accounts?.name || 'No account'}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{sizeLabel || '-'}</span>
          <span>{deal.probability || 0}%</span>
        </div>
        {deal.next_action && (
          <p className="mt-2 text-xs text-muted-foreground truncate">{deal.next_action}</p>
        )}
      </CardContent>
    </Card>
  );
}
