import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useDeals, useDeal, DEAL_SIZES, OBJECTION_TYPES, PROBABILITY_LEVELS, Deal } from '@/hooks/useDeals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useDealFieldConfig } from '@/hooks/useDealFieldConfig';
import { isTreneurWorkspace } from '@/lib/workspaceFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useDealFiles } from '@/hooks/useDealFiles';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountSearchSelect } from '@/components/deals/AccountSearchSelect';
import { ContactSearchSelect } from '@/components/deals/ContactSearchSelect';
import { DealFileUpload } from '@/components/deals/DealFileUpload';
import { StageValidationModal } from '@/components/deals/StageValidationModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, CalendarIcon, ExternalLink, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MissingField {
  field: string;
  label: string;
}

export default function DealForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAccountId = !id ? searchParams.get('account_id') || '' : '';
  const isEdit = !!id;

  const { deal, isLoading: isDealLoading } = useDeal(id);
  const { createDeal, updateDeal, isCreating, isUpdating } = useDeals();
  const { playbooks } = usePlaybooks();
  const { accounts } = useAccounts();
  const { proposalFiles, sitePhotos, uploadFile, deleteFile, isUploading, isDeleting, getFileUrl } = useDealFiles(id);
  const { dealTypes, showDealSizeRange, motiveLabel, motives, roleLabel, roles } = useDealFieldConfig();
  const { stages } = usePipelineStages();
  const { activeWorkspaceId } = useAuth();
  const isTreneur = isTreneurWorkspace(activeWorkspaceId);

  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [contextOpen, setContextOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [formData, setFormData] = useState({
    account_id: preselectedAccountId,
    deal_name: '',
    deal_type: '',
    stage: 'signal_target',
    playbook_id: '',
    primary_contact_id: '',
    deal_size_range: '',
    probability: null as number | null,
    next_action: '',
    next_action_date: null as Date | null,
    trigger_signal: '',
    buying_motive: '',
    primary_buyer_role: '',
    primary_objection: '',
    objection_notes: '',
    proposal_link: '',
    proposal_requested_date: null as Date | null,
    proposal_submitted_date: null as Date | null,
    site_notes: '',
    internal_notes: '',
    project_street: '',
    project_city: '',
    project_state: '',
    project_zip: '',
  });

  // Auto-generate deal name
  const selectedAccount = accounts.find((a) => a.id === formData.account_id);
  const selectedDealType = dealTypes.find((t) => t.value === formData.deal_type);
  const autoDealName = useMemo(() => {
    if (selectedAccount && selectedDealType) {
      return `${selectedAccount.name} – ${selectedDealType.label}`;
    }
    return '';
  }, [selectedAccount, selectedDealType]);

  useEffect(() => {
    if (!formData.deal_name && autoDealName) {
      setFormData((prev) => ({ ...prev, deal_name: autoDealName }));
    }
  }, [autoDealName]);

  // Load existing deal data
  useEffect(() => {
    if (deal && isEdit) {
      setFormData({
        account_id: deal.account_id,
        deal_name: deal.deal_name || deal.accounts?.name || '',
        deal_type: deal.deal_type || '',
        stage: deal.stage,
        playbook_id: deal.playbook_id || '',
        primary_contact_id: deal.primary_contact_id || '',
        deal_size_range: deal.deal_size_range || '',
        probability: deal.probability,
        next_action: deal.next_action || '',
        next_action_date: deal.next_action_date ? new Date(deal.next_action_date) : null,
        trigger_signal: deal.trigger_signal || '',
        buying_motive: deal.buying_motive || '',
        primary_buyer_role: deal.primary_buyer_role || '',
        primary_objection: deal.primary_objection || '',
        objection_notes: deal.objection_notes || '',
        proposal_link: (deal as any).proposal_link || '',
        proposal_requested_date: deal.proposal_requested_date ? new Date(deal.proposal_requested_date) : null,
        proposal_submitted_date: deal.proposal_submitted_date ? new Date(deal.proposal_submitted_date) : null,
        site_notes: deal.site_notes || '',
        internal_notes: deal.internal_notes || '',
        project_street: (deal as any).project_street || '',
        project_city: (deal as any).project_city || '',
        project_state: (deal as any).project_state || '',
        project_zip: (deal as any).project_zip || '',
      });
    }
  }, [deal, isEdit]);

  const validateStageAdvance = (): MissingField[] => {
    const missing: MissingField[] = [];

    if (formData.stage !== 'signal_target') {
      if (!isTreneur && !formData.primary_contact_id) missing.push({ field: 'primary_contact_id', label: 'Primary Stakeholder' });
      // Only validate deal_size_range if shown (not for Treneur)
      if (showDealSizeRange && !formData.deal_size_range) {
        missing.push({ field: 'deal_size_range', label: 'Opportunity Size Range' });
      }
      if (formData.probability === null) missing.push({ field: 'probability', label: 'Probability' });
      if (!formData.next_action) missing.push({ field: 'next_action', label: 'Next Action' });
      if (!formData.next_action_date) missing.push({ field: 'next_action_date', label: 'Next Action Date' });
    }

    return missing;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields for stage advance
    if (formData.stage !== 'signal_target') {
      const missing = validateStageAdvance();
      if (missing.length > 0) {
        setMissingFields(missing);
        setValidationModalOpen(true);
        return;
      }
    }

    const dealData = {
      account_id: formData.account_id,
      deal_name: formData.deal_name || null,
      deal_type: formData.deal_type || null,
      stage: formData.stage,
      playbook_id: formData.playbook_id || null,
      primary_contact_id: formData.primary_contact_id || null,
      deal_size_range: formData.deal_size_range || null,
      probability: formData.probability,
      next_action: formData.next_action || null,
      next_action_date: formData.next_action_date?.toISOString().split('T')[0] || null,
      trigger_signal: formData.trigger_signal || null,
      buying_motive: formData.buying_motive || null,
      primary_buyer_role: formData.primary_buyer_role || null,
      primary_objection: formData.primary_objection || null,
      objection_notes: formData.objection_notes || null,
      proposal_link: formData.proposal_link || null,
      proposal_requested_date: formData.proposal_requested_date?.toISOString().split('T')[0] || null,
      proposal_submitted_date: formData.proposal_submitted_date?.toISOString().split('T')[0] || null,
      site_notes: formData.site_notes || null,
      internal_notes: formData.internal_notes || null,
      project_street: formData.project_street || null,
      project_city: formData.project_city || null,
      project_state: formData.project_state || null,
      project_zip: formData.project_zip || null,
      status: formData.stage === 'won' ? 'won' : formData.stage === 'lost_archived' ? 'lost' : 'open',
      last_meaningful_activity_date: undefined as string | undefined,
    };

    // Auto-update stage when proposal is submitted
    if (formData.proposal_submitted_date && formData.stage !== 'proposal_out' && formData.stage !== 'decision' && formData.stage !== 'won') {
      dealData.stage = 'proposal_out';
      dealData.last_meaningful_activity_date = new Date().toISOString().split('T')[0];
    }

    if (isEdit && deal) {
      updateDeal({ id: deal.id, ...dealData } as any);
    } else {
      createDeal(dealData as any);
    }

    navigate('/deals');
  };

  const isLoading = isCreating || isUpdating;
  const canSubmit = formData.account_id && formData.deal_type;

  if (isEdit && isDealLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/deals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Core Opportunity Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core Opportunity Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account *</Label>
                  <AccountSearchSelect
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opportunity Type *</Label>
                  <Select
                    value={formData.deal_type}
                    onValueChange={(value) => setFormData({ ...formData, deal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opportunity Name</Label>
                <Input
                  value={formData.deal_name}
                  onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
                  placeholder="Auto-filled: Account – Opportunity Type"
                />
              </div>

              {/* Project Address */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-semibold">Project Address</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Street</Label>
                    <Input
                      value={formData.project_street}
                      onChange={(e) => setFormData({ ...formData, project_street: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <Input
                        value={formData.project_city}
                        onChange={(e) => setFormData({ ...formData, project_city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <Input
                        value={formData.project_state}
                        onChange={(e) => setFormData({ ...formData, project_state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Zip</Label>
                      <Input
                        value={formData.project_zip}
                        onChange={(e) => setFormData({ ...formData, project_zip: e.target.value })}
                        placeholder="Zip"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pipeline Stage *</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Execution Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Execution Fields
                {formData.stage !== 'signal_target' && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Required for this stage)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned Playbook</Label>
                  <Select
                    value={formData.playbook_id}
                    onValueChange={(value) => setFormData({ ...formData, playbook_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select playbook" />
                    </SelectTrigger>
                    <SelectContent>
                      {playbooks.map((pb) => (
                        <SelectItem key={pb.id} value={pb.id}>{pb.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Primary Stakeholder {!isTreneur && formData.stage !== 'signal_target' && '*'}
                  </Label>
                  <ContactSearchSelect
                    value={formData.primary_contact_id}
                    onValueChange={(value) => setFormData({ ...formData, primary_contact_id: value })}
                    accountId={formData.account_id}
                    disabled={!formData.account_id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showDealSizeRange && (
                  <div className="space-y-2">
                    <Label>
                      Opportunity Size Range {formData.stage !== 'signal_target' && '*'}
                    </Label>
                    <Select
                      value={formData.deal_size_range}
                      onValueChange={(value) => setFormData({ ...formData, deal_size_range: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    Probability {formData.stage !== 'signal_target' && '*'}
                  </Label>
                  <Select
                    value={formData.probability?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select probability" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROBABILITY_LEVELS.map((p) => (
                        <SelectItem key={p.value} value={p.numeric.toString()}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Next Action {formData.stage !== 'signal_target' && '*'}
                  </Label>
                  <Input
                    value={formData.next_action}
                    onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                    placeholder="e.g., Send spec package"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Next Action Date {formData.stage !== 'signal_target' && '*'}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.next_action_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.next_action_date ? format(formData.next_action_date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.next_action_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, next_action_date: date || null })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Opportunity Context (Collapsible) */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Opportunity Context</CardTitle>
                    {contextOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Signal</Label>
                      <Input
                        value={formData.trigger_signal}
                        onChange={(e) => setFormData({ ...formData, trigger_signal: e.target.value })}
                        placeholder="e.g., Inbound pricing request"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{motiveLabel}</Label>
                      <Select
                        value={formData.buying_motive}
                        onValueChange={(value) => setFormData({ ...formData, buying_motive: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select motive" />
                        </SelectTrigger>
                        <SelectContent>
                          {motives.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{roleLabel}</Label>
                      <Select
                        value={formData.primary_buyer_role}
                        onValueChange={(value) => setFormData({ ...formData, primary_buyer_role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary Objection</Label>
                      <Select
                        value={formData.primary_objection}
                        onValueChange={(value) => setFormData({ ...formData, primary_objection: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select objection" />
                        </SelectTrigger>
                        <SelectContent>
                          {OBJECTION_TYPES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Objection Notes</Label>
                    <Textarea
                      value={formData.objection_notes}
                      onChange={(e) => setFormData({ ...formData, objection_notes: e.target.value })}
                      placeholder="Additional context about objections..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Proposal Management moved to dedicated Proposal page */}

          {/* SECTION 5: Site Context (Collapsible) */}
          <Collapsible open={siteOpen} onOpenChange={setSiteOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Site Context</CardTitle>
                    {siteOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {isEdit && (
                    <DealFileUpload
                      files={sitePhotos}
                      fileType="site_photo"
                      onUpload={(file) => uploadFile({ dealId: id!, file, fileType: 'site_photo' })}
                      onDelete={deleteFile}
                      getFileUrl={getFileUrl}
                      isUploading={isUploading}
                      isDeleting={isDeleting}
                      label="Site Photos"
                      accept=".jpg,.jpeg,.png"
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Site Notes</Label>
                    <Textarea
                      value={formData.site_notes}
                      onChange={(e) => setFormData({ ...formData, site_notes: e.target.value })}
                      placeholder="Existing fitness space, ceiling height, power constraints..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* SECTION 6: Notes (Collapsible) */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Internal Notes</CardTitle>
                    {notesOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Internal Opportunity Notes</Label>
                    <Textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      placeholder="Human context not captured elsewhere. Not sent to clients."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/deals')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Opportunity' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </div>

      <StageValidationModal
        open={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        missingFields={missingFields}
        targetStage={stages.find((s) => s.value === formData.stage)?.label || formData.stage}
      />
    </AppLayout>
  );
}
