import { format, startOfWeek, addDays } from 'date-fns';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_ORDER, SM_PLATFORMS, type SMPlatform } from '@/lib/socialMediaConstants';
import type { CalendarDayData, CalendarContentItem } from '@/hooks/useSMCalendarData';
import { ContentThumbnail } from './ContentThumbnail';

interface CalendarWeekViewProps {
  currentDate: Date;
  calendarData: Record<string, CalendarDayData>;
  contentByDate: Record<string, CalendarContentItem[]>;
  onCellClick: (date: string, platform: SMPlatform) => void;
  selectedPlatforms: SMPlatform[];
  selectedCampaignIds: string[];
  isLoading?: boolean;
}

export function CalendarWeekView({
  currentDate,
  calendarData,
  contentByDate,
  onCellClick,
  selectedPlatforms,
  selectedCampaignIds,
  isLoading,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
    <div className="border rounded-lg overflow-hidden">
      {/* Header row with dates */}
      <div className="grid" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
        <div className="bg-muted p-2 border-b border-r text-sm font-medium text-muted-foreground">
          Platform
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="bg-muted p-2 border-b text-center">
            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
            <div className="text-sm font-medium">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* Platform rows */}
      {platformsToShow.map((platform) => {
        const platformConfig = SM_PLATFORMS.find(p => p.value === platform);
        const Icon = platformConfig?.icon;

        return (
          <div
            key={platform}
            className="grid"
            style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}
          >
            {/* Platform label */}
            <div className="flex items-center gap-2 p-2 border-b border-r bg-muted/50">
              {Icon && <Icon className="h-4 w-4" style={{ color: platformConfig?.color }} />}
              <span className="text-sm font-medium">{platformConfig?.label}</span>
            </div>

            {/* Day cells */}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayData = calendarData[dateStr];
              const platformData = dayData?.platforms[platform];
              const hasSlot = platformData?.hasSlot || false;
              const dayContent = contentByDate[dateStr]?.filter(c => c.platform === platform) || [];

              // Filter by selected campaigns
              const filteredContent = selectedCampaignIds.length > 0
                ? dayContent.filter(c => c.campaignId && selectedCampaignIds.includes(c.campaignId))
                : dayContent;

              const hasContent = filteredContent.length > 0;
              const campaignColor = platformData?.campaignColor;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[80px] border-b p-1 cursor-pointer transition-colors hover:bg-muted/50',
                  )}
                  style={
                    hasContent && campaignColor
                      ? { backgroundColor: `${campaignColor}20` }  // Full color tint
                      : hasSlot && campaignColor
                        ? { backgroundColor: `${campaignColor}08` }  // Very subtle muted tint
                        : undefined
                  }
                  onClick={() => onCellClick(dateStr, platform)}
                >
                  {hasContent ? (
                    <div className="space-y-1">
                      {filteredContent.slice(0, 2).map((item) => (
                        <ContentThumbnail key={item.id} item={item} compact />
                      ))}
                      {filteredContent.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{filteredContent.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : hasSlot ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-xs text-muted-foreground italic">Scheduled</div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
