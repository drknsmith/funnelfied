import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';
import { 
  PropertyClass, 
  SelectedDemographics, 
  AdvancedOverrides,
  DEMOGRAPHIC_OPTIONS,
  DEFAULTS
} from '@/lib/superiorProposalAlgorithm';
import type { DemographicCategory } from '@/lib/superiorProposalAlgorithm';
import { DealSearchSelect } from '@/components/deals/DealSearchSelect';
import { DealWithRelations } from '@/hooks/useDeals';

interface ProposalInputPanelProps {
  communityName: string;
  setCommunityName: (value: string) => void;
  communityAddress: string;
  setCommunityAddress: (value: string) => void;
  units: string;
  setUnits: (value: string) => void;
  propertyClass: PropertyClass;
  setPropertyClass: (value: PropertyClass) => void;
  demographics: SelectedDemographics;
  setDemographics: (value: SelectedDemographics) => void;
  sfOverride: string;
  setSfOverride: (value: string) => void;
  compsRadius: number;
  setCompsRadius: (value: number) => void;
  advancedOverrides: AdvancedOverrides;
  setAdvancedOverrides: (value: AdvancedOverrides) => void;
  onFetchComps: () => void;
  isFetchingComps: boolean;
  // New optional props for deal selection
  dealId?: string;
  setDealId?: (dealId: string, deal?: DealWithRelations) => void;
  dealName?: string;
  isEmbeddedInDeal?: boolean;
}

export function ProposalInputPanel({
  communityName,
  setCommunityName,
  communityAddress,
  setCommunityAddress,
  units,
  setUnits,
  propertyClass,
  setPropertyClass,
  demographics,
  setDemographics,
  sfOverride,
  setSfOverride,
  compsRadius,
  setCompsRadius,
  advancedOverrides,
  setAdvancedOverrides,
  onFetchComps,
  isFetchingComps,
  dealId,
  setDealId,
  dealName,
  isEmbeddedInDeal = false
}: ProposalInputPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDemographicChange = (category: DemographicCategory, segment: string, checked: boolean) => {
    const current = demographics[category] || [];
    const updated = checked
      ? [...current, segment]
      : current.filter(s => s !== segment);
    
    setDemographics({
      ...demographics,
      [category]: updated.length > 0 ? updated : undefined
    });
  };

  const handleAdvancedChange = (key: keyof AdvancedOverrides, value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue)) {
      const { [key]: _, ...rest } = advancedOverrides;
      setAdvancedOverrides(rest);
    } else {
      setAdvancedOverrides({ ...advancedOverrides, [key]: numValue });
    }
  };

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Community Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal Name Field */}
        <div className="space-y-2">
          <Label htmlFor="dealName">Deal Name</Label>
          {isEmbeddedInDeal ? (
            <Input
              id="dealName"
              value={dealName || ''}
              readOnly
              disabled
              className="bg-muted"
            />
          ) : (
            <DealSearchSelect
              value={dealId || ''}
              onValueChange={(id, deal) => setDealId?.(id, deal)}
            />
          )}
        </div>

        {/* Basic Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="communityName">Community Name</Label>
            <Input
              id="communityName"
              placeholder="e.g., Sunrise Apartments"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="communityAddress">Community Address *</Label>
            <Input
              id="communityAddress"
              placeholder="123 Main St, City, State"
              value={communityAddress}
              onChange={(e) => setCommunityAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="units">Units</Label>
            <Input
              id="units"
              type="number"
              placeholder="Number of units"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyClass">Property Class</Label>
            <Select value={propertyClass} onValueChange={(v) => setPropertyClass(v as PropertyClass)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Class A (Luxury)</SelectItem>
                <SelectItem value="B">Class B (Market Rate)</SelectItem>
                <SelectItem value="C">Class C (Affordable)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sfOverride">SF Override (optional)</Label>
            <Input
              id="sfOverride"
              type="number"
              placeholder="Override calculated SF"
              value={sfOverride}
              onChange={(e) => setSfOverride(e.target.value)}
            />
          </div>
        </div>

        {/* Demographics Multi-select */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Demographics (Optional)</Label>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(DEMOGRAPHIC_OPTIONS) as DemographicCategory[]).map((category) => (
              <div key={category} className="space-y-2">
                <Label className="text-sm text-muted-foreground">{category}</Label>
                <div className="space-y-1">
                  {DEMOGRAPHIC_OPTIONS[category].map((segment) => (
                    <div key={segment} className="flex items-center gap-2">
                      <Checkbox
                        id={`${category}-${segment}`}
                        checked={(demographics[category] || []).includes(segment)}
                        onCheckedChange={(checked) => 
                          handleDemographicChange(category, segment, checked === true)
                        }
                      />
                      <label 
                        htmlFor={`${category}-${segment}`}
                        className="text-sm cursor-pointer"
                      >
                        {segment}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comps Radius */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Comps Radius: {compsRadius} miles</Label>
            <Button
              onClick={onFetchComps}
              disabled={!communityAddress.trim() || isFetchingComps}
              size="sm"
            >
              {isFetchingComps ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Find Comps
            </Button>
          </div>
          <Slider
            value={[compsRadius]}
            onValueChange={([value]) => setCompsRadius(value)}
            min={1}
            max={20}
            step={1}
          />
        </div>

        {/* Advanced Settings */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Advanced Settings</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="adultsPerUnit">Adults per Unit</Label>
                <Input
                  id="adultsPerUnit"
                  type="number"
                  step="0.01"
                  placeholder={String(DEFAULTS.adultsPerUnit)}
                  value={advancedOverrides.adultsPerUnit ?? ''}
                  onChange={(e) => handleAdvancedChange('adultsPerUnit', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="residentsPercent">Residents Using FC (%)</Label>
                <Input
                  id="residentsPercent"
                  type="number"
                  placeholder={String(DEFAULTS.residentsPercent)}
                  value={advancedOverrides.residentsPercent ?? ''}
                  onChange={(e) => handleAdvancedChange('residentsPercent', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peakPercent">Peak Utilization (%)</Label>
                <Input
                  id="peakPercent"
                  type="number"
                  placeholder={String(DEFAULTS.peakPercent)}
                  value={advancedOverrides.peakPercent ?? ''}
                  onChange={(e) => handleAdvancedChange('peakPercent', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peakDays">Peak Days/Week</Label>
                <Input
                  id="peakDays"
                  type="number"
                  placeholder={String(DEFAULTS.peakDays)}
                  value={advancedOverrides.peakDays ?? ''}
                  onChange={(e) => handleAdvancedChange('peakDays', e.target.value)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
