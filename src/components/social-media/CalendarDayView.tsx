import { format } from 'date-fns';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLATFORM_ORDER, SM_PLATFORMS, CONTENT_STATUSES, type SMPlatform, type ContentStatus } from '@/lib/socialMediaConstants';
import type { CalendarDayData, CalendarContentItem } from '@/hooks/useSMCalendarData';
import { ContentThumbnail } from './ContentThumbnail';

interface CalendarDayViewProps {
  currentDate: Date;
  calendarData: Record<string, CalendarDayData>;
  contentByDate: Record<string, CalendarContentItem[]>;
  onAddContent: (platform: SMPlatform) => void;
  selectedPlatforms: SMPlatform[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  idea: 'bg-gray-500',
  draft: 'bg-yellow-500',
  ready: 'bg-blue-500',
  published: 'bg-green-500',
  skipped: 'bg-red-500',
};

export function CalendarDayView({
  currentDate,
  calendarData,
  contentByDate,
  onAddContent,
  selectedPlatforms,
  isLoading,
}: CalendarDayViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayData = calendarData[dateStr];
  const dayContent = contentByDate[dateStr] || [];

  // Filter platforms if specific ones are selected
  const platformsToShow = selectedPlatforms.length > 0
    ? PLATFORM_ORDER.filter(p => selectedPlatforms.includes(p))
    : PLATFORM_ORDER;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platformsToShow.map((platform) => {
        const platformConfig = SM_PLATFORMS.find(p => p.value === platform);
        const Icon = platformConfig?.icon;
        const platformContent = dayContent.filter(c => c.platform === platform);
        const platformData = dayData?.platforms[platform];
        const hasSlot = platformData?.hasSlot || false;
        const hasContent = platformContent.length > 0;

        return (
          <div key={platform} className="border rounded-lg overflow-hidden">
            {/* Platform header */}
            <div
              className="flex items-center justify-between p-3 bg-muted"
              style={{ borderLeft: `4px solid ${platformConfig?.color}` }}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5" style={{ color: platformConfig?.color }} />}
                <span className="font-medium">{platformConfig?.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {platformContent.length} item(s)
                </Badge>
                {hasSlot && !hasContent && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    Scheduled
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => onAddContent(platform)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Content items */}
            <div className="p-4">
              {platformContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {hasSlot ? 'Slot scheduled - no content added yet' : 'No content scheduled for this platform'}
                </p>
              ) : (
                <div className="space-y-4">
                  {platformContent.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-24 h-24 flex-shrink-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title || 'Content'}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground">
                            No media
                          </div>
                        )}
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium truncate">
                            {item.title || 'Untitled'}
                          </h4>
                          <Badge className={cn('shrink-0', STATUS_COLORS[item.status])}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        {item.campaignName && (
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.campaignColor || '#888' }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.campaignName}
                            </span>
                          </div>
                        )}

                        {item.caption && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
