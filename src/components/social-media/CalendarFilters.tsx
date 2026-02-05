import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, X } from 'lucide-react';
import { SM_PLATFORMS, SLOT_STATUSES, type SMPlatform, type SlotStatus } from '@/lib/socialMediaConstants';
import type { SMCampaign } from '@/hooks/useSMCampaigns';

interface CalendarFiltersProps {
  campaigns: SMCampaign[];
  selectedPlatforms: SMPlatform[];
  onPlatformsChange: (platforms: SMPlatform[]) => void;
  selectedCampaignIds: string[];
  onCampaignsChange: (campaignIds: string[]) => void;
  selectedStatuses: SlotStatus[];
  onStatusesChange: (statuses: SlotStatus[]) => void;
}

export function CalendarFilters({
  campaigns,
  selectedPlatforms,
  onPlatformsChange,
  selectedCampaignIds,
  onCampaignsChange,
  selectedStatuses,
  onStatusesChange,
}: CalendarFiltersProps) {
  const hasFilters = selectedPlatforms.length > 0 || selectedCampaignIds.length > 0 || selectedStatuses.length > 0;

  const clearFilters = () => {
    onPlatformsChange([]);
    onCampaignsChange([]);
    onStatusesChange([]);
  };

  const togglePlatform = (platform: SMPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  const toggleCampaign = (campaignId: string) => {
    if (selectedCampaignIds.includes(campaignId)) {
      onCampaignsChange(selectedCampaignIds.filter(id => id !== campaignId));
    } else {
      onCampaignsChange([...selectedCampaignIds, campaignId]);
    }
  };

  const toggleStatus = (status: SlotStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Platform Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Platforms
            {selectedPlatforms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedPlatforms.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SM_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <DropdownMenuCheckboxItem
                key={platform.value}
                checked={selectedPlatforms.includes(platform.value)}
                onCheckedChange={() => togglePlatform(platform.value)}
              >
                <Icon className="h-4 w-4 mr-2" style={{ color: platform.color }} />
                {platform.label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Campaign Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Campaigns
            {selectedCampaignIds.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCampaignIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Filter by Campaign</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {campaigns.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No campaigns yet
            </div>
          ) : (
            campaigns.map((campaign) => (
              <DropdownMenuCheckboxItem
                key={campaign.id}
                checked={selectedCampaignIds.includes(campaign.id)}
                onCheckedChange={() => toggleCampaign(campaign.id)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: campaign.color }}
                />
                {campaign.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Status
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SLOT_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={() => toggleStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
