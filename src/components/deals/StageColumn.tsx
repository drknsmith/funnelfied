import { useState } from 'react';
import { DealWithRelations } from '@/hooks/useDeals';
import { Badge } from '@/components/ui/badge';
import DealCard from './DealCard';
import { cn } from '@/lib/utils';

interface StageColumnProps {
  stage: { value: string; label: string };
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
  onDragStart: (e: React.DragEvent, deal: DealWithRelations) => void;
  onDrop: (e: React.DragEvent, targetStage: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  draggingDealId?: string;
}

export default function StageColumn({
  stage,
  deals,
  onDealClick,
  onDragStart,
  onDrop,
  onDragOver,
  draggingDealId,
}: StageColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, stage.value);
  };

  return (
    <div className="flex-shrink-0 w-72">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{stage.label}</h3>
        <Badge variant="secondary">{deals.length}</Badge>
      </div>
      <div
        className={cn(
          'space-y-3 min-h-[200px] rounded-lg p-2 transition-colors',
          isDragOver ? 'bg-primary/10 ring-2 ring-primary ring-offset-2' : 'bg-muted/30'
        )}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onClick={() => onDealClick(deal)}
            onDragStart={onDragStart}
            isDragging={draggingDealId === deal.id}
          />
        ))}
      </div>
    </div>
  );
}
