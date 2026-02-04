import { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Share2, Loader2, Copy, Check, Pencil, X } from 'lucide-react';
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
import { useProposalReport, SavedReport } from '@/hooks/useProposalReport';
import { supabase } from '@/integrations/supabase/client';
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

interface ResearchTabProps {
  dealId: string;
  dealName?: string | null;
  accountLocation?: string | null;
}

export function ResearchTab({ dealId, dealName, accountLocation }: ResearchTabProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Research state
  const [existingReport, setExistingReport] = useState<SavedReport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

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
  const { saveReport, updateReport, loadReportByDealId, isSaving, isLoading, isUpdating } = useProposalReport();

  // Load existing report on mount
  useEffect(() => {
    const loadExisting = async () => {
      const report = await loadReportByDealId(dealId);
      if (report) {
        setExistingReport(report);
        // Populate form with existing data
        setCommunityName(report.communityName);
        setCommunityAddress(report.communityAddress);
        setUnits(report.units?.toString() || '');
        setPropertyClass(report.propertyClass as PropertyClass);
        setDemographics(report.demographics);
        setSfOverride(report.sfOverride?.toString() || '');
        setCompsRadius(report.compsRadius);
        setAdvancedOverrides(report.advancedOverrides);
        setMultifamilyComps(report.multifamilyComps);
        setFitnessComps(report.fitnessComps);
        setMapCenter(report.mapCenter || undefined);
      } else {
        // Pre-populate from deal data - Community Name stays blank for user input
        // Only pre-fill Community Address from account location
        if (accountLocation) setCommunityAddress(accountLocation);
        setIsEditing(true); // Start in edit mode for new research
      }
      setInitialLoad(false);
    };
    loadExisting();
  }, [dealId, dealName, accountLocation]);

  // Get Mapbox token for print view
  useEffect(() => {
    const getToken = async () => {
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      if (data?.token) setMapboxToken(data.token);
    };
    getToken();
  }, []);

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
  const hasOutputs = outputs.section1_budget.ok || outputs.section2_squareFootage.ok;

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
    documentTitle: `Research - ${communityName || 'Fitness Center'}`,
  });

  const handleSave = async () => {
    const data = {
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
      dealId
    };

    if (existingReport) {
      // Update existing report
      const success = await updateReport(existingReport.id, data);
      if (success) {
        setExistingReport({
          ...existingReport,
          ...data,
          units: data.units ?? null,
          sfOverride: data.sfOverride ?? null,
          mapCenter: data.mapCenter ?? null
        });
        setIsEditing(false);
      }
    } else {
      // Create new report
      const result = await saveReport(data);
      if (result) {
        const newReport = await loadReportByDealId(dealId);
        if (newReport) {
          setExistingReport(newReport);
          setIsEditing(false);
        }
      }
    }
  };

  const handleShare = async () => {
    if (existingReport) {
      const url = `${window.location.origin}/superior/reports/${existingReport.token}`;
      setShareUrl(url);
    } else {
      // Save first, then share
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
          dealId
        },
        expirationDays === 'never' ? undefined : parseInt(expirationDays)
      );

      if (result) {
        setShareUrl(result.url);
        const newReport = await loadReportByDealId(dealId);
        if (newReport) {
          setExistingReport(newReport);
          setIsEditing(false);
        }
      }
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

  const handleCancelEdit = () => {
    if (existingReport) {
      // Restore from existing report
      setCommunityName(existingReport.communityName);
      setCommunityAddress(existingReport.communityAddress);
      setUnits(existingReport.units?.toString() || '');
      setPropertyClass(existingReport.propertyClass as PropertyClass);
      setDemographics(existingReport.demographics);
      setSfOverride(existingReport.sfOverride?.toString() || '');
      setCompsRadius(existingReport.compsRadius);
      setAdvancedOverrides(existingReport.advancedOverrides);
      setMultifamilyComps(existingReport.multifamilyComps);
      setFitnessComps(existingReport.fitnessComps);
      setMapCenter(existingReport.mapCenter || undefined);
      setIsEditing(false);
    }
  };

  if (initialLoad || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show outputs view when not editing and we have an existing report
  if (existingReport && !isEditing) {
    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Market Research</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrint()} disabled={!hasOutputs}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Community</p>
                <p className="font-medium">{existingReport.communityName || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{existingReport.communityAddress || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Units</p>
                <p className="font-medium">{existingReport.units || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Property Class</p>
                <p className="font-medium">{existingReport.propertyClass}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Sections */}
        <ProposalOutputsComponent
          outputs={existingReport.outputs}
          multifamilyComps={existingReport.multifamilyComps}
          fitnessComps={existingReport.fitnessComps}
          hasAddress={!!existingReport.communityAddress}
          hasUnitsOrSF={!!(existingReport.units || existingReport.sfOverride)}
        />

        {/* Map */}
        <ProposalMap
          mapCenter={existingReport.mapCenter || undefined}
          communityName={existingReport.communityName}
          multifamilyComps={existingReport.multifamilyComps}
          fitnessComps={existingReport.fitnessComps}
        />

        {/* Hidden Print View */}
        <div className="hidden">
          <ProposalPrintView
            ref={printRef}
            communityName={existingReport.communityName}
            communityAddress={existingReport.communityAddress}
            outputs={existingReport.outputs}
            multifamilyComps={existingReport.multifamilyComps}
            fitnessComps={existingReport.fitnessComps}
            mapCenter={existingReport.mapCenter || undefined}
            mapboxToken={mapboxToken}
          />
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Research</DialogTitle>
              <DialogDescription>
                Share this market research via a link
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shareable Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl || `${window.location.origin}/superior/reports/${existingReport.token}`} 
                    readOnly 
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => {
                      const url = shareUrl || `${window.location.origin}/superior/reports/${existingReport.token}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link copied!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view the research.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show edit/create form
  return (
    <div className="space-y-6">
      {/* Header with save/cancel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {existingReport ? 'Edit Research' : 'New Research'}
          </CardTitle>
          <div className="flex gap-2">
            {existingReport && (
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving || isUpdating}>
              {(isSaving || isUpdating) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {existingReport ? 'Save Changes' : 'Save Research'}
            </Button>
          </div>
        </CardHeader>
      </Card>

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
        dealName={dealName || undefined}
        isEmbeddedInDeal={true}
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
                Anyone with this link can view the research
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
  );
}
