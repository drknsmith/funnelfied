import { useState, useMemo, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canUseResearch } from '@/lib/workspaceFeatures';
import { Button } from '@/components/ui/button';
import { Printer, Share2, Loader2, Copy, Check, Save } from 'lucide-react';
import { 
  generateProposalOutputs,
  PropertyClass,
  SelectedDemographics,
  AdvancedOverrides 
} from '@/lib/superiorProposalAlgorithm';
import { ProposalInputPanel } from '@/components/proposal/ProposalInputPanel';
import { ProposalOutputsComponent } from '@/components/proposal/ProposalOutputs';
import { ProposalMap } from '@/components/proposal/ProposalMap';
import { ProposalPrintView } from '@/components/proposal/ProposalPrintView';
import { useProposalComps, MultifamilyComp, FitnessComp } from '@/hooks/useProposalComps';
import { useProposalReport } from '@/hooks/useProposalReport';
import { supabase } from '@/integrations/supabase/client';
import { DealWithRelations } from '@/hooks/useDeals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';

export default function Research() {
  const navigate = useNavigate();
  const { activeWorkspaceId, workspaceId } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const featureWorkspaceId = workspaceId || activeWorkspaceId;

  // Check workspace access
  const hasAccess = canUseResearch(featureWorkspaceId);

  // Redirect if no access
  useEffect(() => {
    if (featureWorkspaceId && !hasAccess) {
      navigate('/');
    }
  }, [featureWorkspaceId, hasAccess, navigate]);

  // Deal selection state (for standalone Research page)
  const [selectedDealId, setSelectedDealId] = useState('');

  // Input state
  const [communityName, setCommunityName] = useState('');
  const [communityAddress, setCommunityAddress] = useState('');
  const [units, setUnits] = useState('');
  const [propertyClass, setPropertyClass] = useState<PropertyClass>('B');
  const [demographics, setDemographics] = useState<SelectedDemographics>({});
  const [sfOverride, setSfOverride] = useState('');
  const [compsRadius, setCompsRadius] = useState(5);
  const [advancedOverrides, setAdvancedOverrides] = useState<AdvancedOverrides>({});

  // Comps state
  const [multifamilyComps, setMultifamilyComps] = useState<MultifamilyComp[]>([]);
  const [fitnessComps, setFitnessComps] = useState<FitnessComp[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('7');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Hooks
  const { fetchComps, isLoading: isFetchingComps } = useProposalComps();
  const { saveReport, isSaving } = useProposalReport();

  // Get Mapbox token for print view
  useEffect(() => {
    const getToken = async () => {
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      if (data?.token) setMapboxToken(data.token);
    };
    getToken();
  }, []);

  // Handle opportunity selection - auto-populate project name and address
  const handleDealChange = (dealId: string, deal?: DealWithRelations) => {
    setSelectedDealId(dealId);
    if (!deal) return;
    // Project Name = opportunity/deal name (fallback to account name)
    const nextName = deal.deal_name || deal.accounts?.name || '';
    if (nextName) setCommunityName(nextName);
    // Project Address = opportunity project address (fallback to account location)
    const parts = [
      (deal as any).project_street,
      (deal as any).project_city,
      (deal as any).project_state,
      (deal as any).project_zip,
    ].filter(Boolean);
    const projectAddress = parts.length ? parts.join(', ') : (deal.accounts?.location || '');
    if (projectAddress) setCommunityAddress(projectAddress);
  };

  // Computed outputs
  const outputs = useMemo(() => {
    return generateProposalOutputs({
      units: units ? parseInt(units) : undefined,
      sfOverride: sfOverride ? parseInt(sfOverride) : undefined,
      propertyClass,
      selectedDemographics: demographics,
      advancedOverrides
    });
  }, [units, sfOverride, propertyClass, demographics, advancedOverrides]);

  const hasAddress = communityAddress.trim().length > 0;
  const hasUnitsOrSF = (units && parseInt(units) > 0) || (sfOverride && parseInt(sfOverride) > 0);

  // Handlers
  const handleFetchComps = async () => {
    const result = await fetchComps(communityAddress, compsRadius);
    if (result) {
      setMultifamilyComps(result.multifamilyComps);
      setFitnessComps(result.fitnessComps);
      setMapCenter(result.mapCenter);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Proposal - ${communityName || 'Fitness Center'}`,
  });

  const handleShare = async () => {
    const result = await saveReport(
      {
        communityName,
        communityAddress,
        units: units ? parseInt(units) : undefined,
        sfOverride: sfOverride ? parseInt(sfOverride) : undefined,
        propertyClass,
        demographics,
        compsRadius,
        advancedOverrides,
        outputs,
        multifamilyComps,
        fitnessComps,
        mapCenter,
        dealId: selectedDealId || undefined
      },
      expirationDays === 'never' ? undefined : parseInt(expirationDays)
    );

    if (result) {
      setShareUrl(result.url);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!hasAccess) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Research</h1>
            <p className="text-muted-foreground">
              Generate presentation-ready market research
            </p>
          </div>
          <div className="flex gap-2">
            {selectedDealId && (
              <Button
                variant="default"
                onClick={async () => {
                  const result = await saveReport(
                    {
                      communityName,
                      communityAddress,
                      units: units ? parseInt(units) : undefined,
                      sfOverride: sfOverride ? parseInt(sfOverride) : undefined,
                      propertyClass,
                      demographics,
                      compsRadius,
                      advancedOverrides,
                      outputs,
                      multifamilyComps,
                      fitnessComps,
                      mapCenter,
                      dealId: selectedDealId
                    },
                    undefined // no expiration for deal-linked research
                  );
                  if (result) {
                    toast.success('Research saved to deal', {
                      action: {
                        label: 'View Deal',
                        onClick: () => navigate(`/deals/${selectedDealId}`)
                      }
                    });
                  }
                }}
                disabled={isSaving || (!outputs.section1_budget.ok && !outputs.section2_squareFootage.ok)}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save to Deal
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handlePrint()}
              disabled={!outputs.section1_budget.ok && !outputs.section2_squareFootage.ok}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
            <Button
              onClick={() => setShareDialogOpen(true)}
              disabled={!outputs.section1_budget.ok && !outputs.section2_squareFootage.ok}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Research
            </Button>
          </div>
        </div>

        {/* Input Panel */}
        <ProposalInputPanel
          communityName={communityName}
          setCommunityName={setCommunityName}
          communityAddress={communityAddress}
          setCommunityAddress={setCommunityAddress}
          units={units}
          setUnits={setUnits}
          propertyClass={propertyClass}
          setPropertyClass={setPropertyClass}
          demographics={demographics}
          setDemographics={setDemographics}
          sfOverride={sfOverride}
          setSfOverride={setSfOverride}
          compsRadius={compsRadius}
          setCompsRadius={setCompsRadius}
          advancedOverrides={advancedOverrides}
          setAdvancedOverrides={setAdvancedOverrides}
          onFetchComps={handleFetchComps}
          isFetchingComps={isFetchingComps}
          dealId={selectedDealId}
          setDealId={handleDealChange}
          isEmbeddedInDeal={false}
        />

        {/* Output Sections */}
        <ProposalOutputsComponent
          outputs={outputs}
          multifamilyComps={multifamilyComps}
          fitnessComps={fitnessComps}
          hasAddress={hasAddress}
          hasUnitsOrSF={!!hasUnitsOrSF}
        />

        {/* Map */}
        <ProposalMap
          mapCenter={mapCenter}
          communityName={communityName}
          multifamilyComps={multifamilyComps}
          fitnessComps={fitnessComps}
        />

        {/* Hidden Print View */}
        <div className="hidden">
          <ProposalPrintView
            ref={printRef}
            communityName={communityName}
            communityAddress={communityAddress}
            outputs={outputs}
            multifamilyComps={multifamilyComps}
            fitnessComps={fitnessComps}
            mapCenter={mapCenter}
            mapboxToken={mapboxToken}
          />
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Research</DialogTitle>
              <DialogDescription>
                Generate a shareable link to this research
              </DialogDescription>
            </DialogHeader>
            
            {!shareUrl ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Link Expiration</Label>
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleShare} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Generate Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Shareable Link</Label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anyone with this link can view the proposal
                  {expirationDays !== 'never' && ` for ${expirationDays} days`}.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => { setShareUrl(''); }}
                  className="w-full"
                >
                  Generate New Link
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
