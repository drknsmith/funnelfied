import { SM_PLATFORMS } from '@/lib/socialMediaConstants';
import type { SMCampaign } from '@/hooks/useSMCampaigns';

interface CalendarLegendProps {
  campaigns: SMCampaign[];
}

export function CalendarLegend({ campaigns }: CalendarLegendProps) {
  const activeCampaigns = campaigns.filter(c => c.is_active);

  if (activeCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">Campaigns:</span>
      {activeCampaigns.map((campaign) => (
        <div key={campaign.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: campaign.color }}
          />
          <span className="text-sm">{campaign.name}</span>
          <div className="flex gap-0.5">
            {campaign.platforms.map((platform) => {
              const config = SM_PLATFORMS.find(p => p.value === platform);
              const Icon = config?.icon;
              return Icon ? (
                <Icon
                  key={platform}
                  className="h-3 w-3 text-muted-foreground"
                />
              ) : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
