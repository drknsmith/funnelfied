import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HealthScoreDotProps {
  score: number | null | undefined;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HealthScoreDot({ score, showScore = false, size = 'md', className }: HealthScoreDotProps) {
  if (score === null || score === undefined) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getHealthLabel = (score: number) => {
    if (score <= 3) return 'High Pain (Great Prospect)';
    if (score <= 7) return 'Moderate Signals';
    return 'Healthy Facility';
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const dot = (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full shrink-0',
          sizeClasses[size],
          getHealthColor(score)
        )}
      />
      {showScore && (
        <span className="text-xs font-medium text-muted-foreground">
          {score}/10
        </span>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {dot}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-medium">Health Score: {score}/10</p>
          <p className="text-muted-foreground">{getHealthLabel(score)}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function getHealthColor(score: number): string {
  if (score <= 3) return 'bg-red-500';
  if (score <= 7) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function getHealthHexColor(score: number): string {
  if (score <= 3) return '#ef4444'; // red-500
  if (score <= 7) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
}
