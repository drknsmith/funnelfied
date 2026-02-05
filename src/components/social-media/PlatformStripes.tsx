import { PLATFORM_ORDER, SM_PLATFORMS, type SMPlatform } from '@/lib/socialMediaConstants';
import type { CalendarDayData } from '@/hooks/useSMCalendarData';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PlatformStripesProps {
  dayData?: CalendarDayData;
  selectedPlatforms: SMPlatform[];
  selectedCampaignIds: string[];
  onStripeClick?: (platform: SMPlatform) => void;
  compact?: boolean;
}

export function PlatformStripes({
  dayData,
  selectedPlatforms,
  selectedCampaignIds,
  onStripeClick,
  compact = false,
}: PlatformStripesProps) {
  // Filter platforms if specific ones are selected
  const platformsToShow = selectedPlatforms.length > 0
    ? PLATFORM_ORDER.filter(p => selectedPlatforms.includes(p))
    : PLATFORM_ORDER;

  return (
    <div className={cn('space-y-1', compact && 'space-y-0.5')}>
      {platformsToShow.map((platform) => {
        const platformData = dayData?.platforms[platform];
        const hasSlot = platformData?.hasSlot || false;
        const hasContent = platformData?.hasContent || false;
        const campaignColor = platformData?.campaignColor;
        const campaignName = platformData?.campaignName;
        const contentCount = platformData?.contentCount || 0;
        
        // Filter by selected campaigns if any
        const isFiltered = selectedCampaignIds.length > 0 && 
          platformData?.campaignId && 
          !selectedCampaignIds.includes(platformData.campaignId);

        if (isFiltered) {
          return null;
        }

        const platformConfig = SM_PLATFORMS.find(p => p.value === platform);
        const Icon = platformConfig?.icon;

        // Styling logic:
        // - hasContent = full campaign color (80% opacity)
        // - hasSlot but !hasContent = muted color (20% opacity) with dashed border
        // - !hasSlot = dashed border only (empty)
        const stripe = (
          <div
            className={cn(
              'flex items-center gap-1 rounded px-1 transition-all',
              compact ? 'h-4' : 'h-5',
              hasSlot && !hasContent && 'border border-dashed', // Slot only - dashed border
              (hasSlot || hasContent) && 'cursor-pointer',
              !hasSlot && !hasContent && 'border border-dashed border-muted-foreground/30',
              onStripeClick && 'hover:ring-1 hover:ring-primary/50'
            )}
            style={
              hasContent && campaignColor
                ? { backgroundColor: `${campaignColor}CC` }  // Full color (80% opacity)
                : hasSlot && campaignColor
                  ? { backgroundColor: `${campaignColor}33`, borderColor: campaignColor }  // Muted (20% opacity)
                  : undefined
            }
            onClick={(e) => {
              e.stopPropagation();
              onStripeClick?.(platform);
            }}
          >
            {Icon && (
              <Icon className={cn(
                'h-3 w-3',
                hasContent ? 'text-white' : hasSlot ? 'text-foreground/70' : 'text-muted-foreground/50'
              )} />
            )}
            {!compact && hasContent && contentCount > 0 && (
              <span className="text-xs text-white font-medium">
                {contentCount}
              </span>
            )}
          </div>
        );

        if ((hasSlot || hasContent) && campaignName) {
          return (
            <Tooltip key={platform}>
              <TooltipTrigger asChild>
                {stripe}
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-medium">{campaignName}</p>
                <p className="text-muted-foreground">
                  {hasContent ? `${contentCount} item(s)` : 'Scheduled (no content yet)'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={platform}>{stripe}</div>;
      })}
    </div>
  );
}
