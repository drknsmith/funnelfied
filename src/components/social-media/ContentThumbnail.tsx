import { cn } from '@/lib/utils';
import type { CalendarContentItem } from '@/hooks/useSMCalendarData';
import { Badge } from '@/components/ui/badge';

interface ContentThumbnailProps {
  item: CalendarContentItem;
  compact?: boolean;
  onClick?: () => void;
}

export function ContentThumbnail({ item, compact = false, onClick }: ContentThumbnailProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded p-1 transition-colors hover:bg-muted',
        compact && 'p-0.5',
        onClick && 'cursor-pointer'
      )}
      style={item.campaignColor ? {
        borderLeft: `2px solid ${item.campaignColor}`,
      } : undefined}
      onClick={onClick}
    >
      {item.thumbnailUrl && (
        <img
          src={item.thumbnailUrl}
          alt={item.title || 'Content'}
          className={cn(
            'object-cover rounded',
            compact ? 'w-6 h-6' : 'w-10 h-10'
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {item.title || item.caption?.slice(0, 30) || 'Untitled'}
        </p>
        {!compact && item.campaignName && (
          <p className="text-xs text-muted-foreground truncate">
            {item.campaignName}
          </p>
        )}
      </div>
      {!compact && (
        <Badge variant="outline" className="text-xs shrink-0">
          {item.status}
        </Badge>
      )}
    </div>
  );
}
