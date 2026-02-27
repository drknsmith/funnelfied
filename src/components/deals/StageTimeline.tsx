import { usePipelineStages } from '@/hooks/usePipelineStages';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StageTimelineProps {
  currentStage: string;
  onStageClick?: (stage: string) => void;
}

export default function StageTimeline({ currentStage, onStageClick }: StageTimelineProps) {
  const { stages } = usePipelineStages();
  const currentIndex = stages.findIndex((s) => s.value === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stages.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={stage.value} className="flex items-center">
            <button
              onClick={() => onStageClick?.(stage.value)}
              disabled={!onStageClick}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all min-w-[80px]',
                onStageClick && 'hover:bg-muted cursor-pointer',
                !onStageClick && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                  isFuture && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs text-center whitespace-nowrap',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
            </button>
            {index < stages.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
