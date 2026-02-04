import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { useDeal, useDeals, DEAL_STAGES, DEAL_SIZES } from '@/hooks/useDeals';
import { useDealFieldConfig } from '@/hooks/useDealFieldConfig';
import { useInteractions } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import { useDealFiles } from '@/hooks/useDealFiles';
import { useAuth } from '@/contexts/AuthContext';
import { canUseResearch } from '@/lib/workspaceFeatures';
import StageTimeline from '@/components/deals/StageTimeline';
import InteractionList from '@/components/deals/InteractionList';
import InteractionFormDialog from '@/components/deals/InteractionFormDialog';
import DealFormDialog from '@/components/deals/DealFormDialog';
import { PlaybookPanel } from '@/components/deals/PlaybookPanel';
import { MessagesTab } from '@/components/deals/MessagesTab';
import { ResearchTab } from '@/components/deals/ResearchTab';
import { PlaybookRequiredModal } from '@/components/deals/PlaybookRequiredModal';
import { DealFileUpload } from '@/components/deals/DealFileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Building2,
  User,
  Calendar as CalendarIcon,
  TrendingUp,
  MessageSquare,
  FileText,
  Link2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspaceId } = useAuth();
  const showResearchTab = canUseResearch(activeWorkspaceId);
  const { deal, isLoading } = useDeal(id!);
  const { updateDeal, deleteDeal, isUpdating, isDeleting } = useDeals();
  const { interactions, createInteraction, deleteInteraction, isCreating, isDeleting: isDeletingInteraction } = useInteractions(id);
  const { contacts } = useContacts();
  const { proposalFiles, uploadFile, deleteFile, getFileUrl, isUploading, isDeleting: isDeletingFile } = useDealFiles(id);
  const { dealTypes, showDealSizeRange, motiveLabel, roleLabel } = useDealFieldConfig();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<string | null>(null);
  
  // Proposal tab state
  const [proposalLink, setProposalLink] = useState('');
  const [proposalRequestedOpen, setProposalRequestedOpen] = useState(false);
  const [proposalSubmittedOpen, setProposalSubmittedOpen] = useState(false);

  // Sync proposal link when deal loads
  useEffect(() => {
    if (deal?.proposal_link) {
      setProposalLink(deal.proposal_link);
    }
  }, [deal?.proposal_link]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!deal) {
    return (
      <AppLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/deals')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Button>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Deal not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stageLabel = DEAL_STAGES.find((s) => s.value === deal.stage)?.label || deal.stage;
  const sizeLabel = DEAL_SIZES.find((s) => s.value === deal.deal_size_range)?.label || deal.deal_size_range;
  const typeLabel = dealTypes.find((t) => t.value === deal.deal_type)?.label || deal.deal_type;
  const dealContacts = contacts.filter((c) => c.account_id === deal.account_id);

  const handleStageChange = (newStage: string) => {
    // Check if moving from signal_target and no playbook assigned
    if (deal.stage === 'signal_target' && newStage !== 'signal_target' && !deal.playbook_id) {
      setPendingStageChange(newStage);
      setPlaybookModalOpen(true);
      return;
    }
    
    updateDeal({ id: deal.id, stage: newStage, last_meaningful_activity_date: new Date().toISOString().split('T')[0] });
  };

  const handlePlaybookConfirm = (playbookId: string) => {
    if (pendingStageChange) {
      updateDeal({
        id: deal.id,
        playbook_id: playbookId,
        stage: pendingStageChange,
        last_meaningful_activity_date: new Date().toISOString().split('T')[0],
      });
      setPendingStageChange(null);
      setPlaybookModalOpen(false);
    }
  };

  const handleUpdateDeal = (data: any) => {
    updateDeal({ id: deal.id, ...data });
    setEditDialogOpen(false);
  };

  const handlePlaybookPanelUpdate = (updates: any) => {
    updateDeal({ id: deal.id, ...updates });
  };

  const handleDeleteDeal = () => {
    deleteDeal(deal.id);
    navigate('/deals');
  };

  const handleLogInteraction = (data: any) => {
    createInteraction(data);
  };

  const handleProposalFieldUpdate = (field: string, value: any) => {
    updateDeal({ id: deal.id, [field]: value });
  };

  const getStatusBadge = () => {
    switch (deal.status) {
      case 'won':
        return <Badge className="bg-green-500 text-white">Won</Badge>;
      case 'lost':
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="secondary">Open</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/deals')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {deal.deal_name || deal.accounts?.name || 'No Account'}
                </h1>
                {getStatusBadge()}
                {deal.playbooks && (
                  <Badge variant="outline" className="bg-primary/10">
                    {deal.playbooks.name}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {deal.deal_name && deal.accounts?.name ? `${deal.accounts.name} • ` : ''}{stageLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Stage Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stage Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <StageTimeline currentStage={deal.stage} onStageClick={handleStageChange} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Deal Info & Interactions Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Details
                </TabsTrigger>
                {showResearchTab && (
                  <TabsTrigger value="research" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Research
                  </TabsTrigger>
                )}
                <TabsTrigger value="interactions" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Interactions
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="proposal" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Proposal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {deal.deal_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Deal Name</p>
                        <p className="text-sm font-medium">{deal.deal_name}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Account</p>
                        <Link to={`/accounts/${deal.account_id}`} className="text-sm font-medium text-primary hover:underline">
                          {deal.accounts?.name}
                        </Link>
                      </div>
                    </div>

                    {deal.contacts && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Primary Contact</p>
                          <Link to={`/contacts/${deal.primary_contact_id}`} className="text-sm font-medium text-primary hover:underline">
                            {deal.contacts.name}
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Deal Type</p>
                        <p className="text-sm font-medium">{typeLabel || '-'}</p>
                      </div>
                      {showDealSizeRange && (
                        <div>
                          <p className="text-xs text-muted-foreground">Deal Size</p>
                          <p className="text-sm font-medium">{sizeLabel || '-'}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Probability</p>
                        <p className="text-sm font-medium">{deal.probability || 0}%</p>
                      </div>
                    </div>

                    {deal.next_action && (
                      <div>
                        <p className="text-xs text-muted-foreground">Next Action</p>
                        <p className="text-sm font-medium">{deal.next_action}</p>
                        {deal.next_action_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(deal.next_action_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}

                    {deal.last_meaningful_activity_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Activity</p>
                        <p className="text-sm font-medium">
                          {format(new Date(deal.last_meaningful_activity_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactions" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                    <Button size="sm" onClick={() => setInteractionDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Log Interaction
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <InteractionList
                      interactions={interactions}
                      onDelete={deleteInteraction}
                      isDeleting={isDeletingInteraction}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="mt-4">
                <MessagesTab deal={deal} />
              </TabsContent>

              {showResearchTab && (
                <TabsContent value="research" className="mt-4">
                  <ResearchTab 
                    dealId={deal.id} 
                    dealName={deal.deal_name || deal.accounts?.name}
                  />
                </TabsContent>
              )}

              <TabsContent value="proposal" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Proposal Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Proposal Link */}
                    <div className="space-y-2">
                      <Label htmlFor="proposal-link">Proposal Link</Label>
                      <div className="flex gap-2">
                        <Input
                          id="proposal-link"
                          type="url"
                          placeholder="https://..."
                          value={proposalLink}
                          onChange={(e) => setProposalLink(e.target.value)}
                          className="flex-1"
                        />
                        {proposalLink && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(proposalLink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => handleProposalFieldUpdate('proposal_link', proposalLink)}
                          disabled={isUpdating}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Proposal Requested Date */}
                      <div className="space-y-2">
                        <Label>Proposal Requested Date</Label>
                        <Popover open={proposalRequestedOpen} onOpenChange={setProposalRequestedOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !deal.proposal_requested_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deal.proposal_requested_date
                                ? format(new Date(deal.proposal_requested_date), 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={deal.proposal_requested_date ? new Date(deal.proposal_requested_date) : undefined}
                              onSelect={(date) => {
                                handleProposalFieldUpdate('proposal_requested_date', date ? format(date, 'yyyy-MM-dd') : null);
                                setProposalRequestedOpen(false);
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Proposal Submitted Date */}
                      <div className="space-y-2">
                        <Label>Proposal Submitted Date</Label>
                        <Popover open={proposalSubmittedOpen} onOpenChange={setProposalSubmittedOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !deal.proposal_submitted_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deal.proposal_submitted_date
                                ? format(new Date(deal.proposal_submitted_date), 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={deal.proposal_submitted_date ? new Date(deal.proposal_submitted_date) : undefined}
                              onSelect={(date) => {
                                handleProposalFieldUpdate('proposal_submitted_date', date ? format(date, 'yyyy-MM-dd') : null);
                                setProposalSubmittedOpen(false);
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Proposal Documents */}
                    <DealFileUpload
                      files={proposalFiles}
                      fileType="proposal"
                      onUpload={(file) => uploadFile({ dealId: deal.id, file, fileType: 'proposal' })}
                      onDelete={(file) => deleteFile(file)}
                      getFileUrl={getFileUrl}
                      isUploading={isUploading}
                      isDeleting={isDeletingFile}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      label="Proposal Documents"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Playbook Panel */}
          <div>
            <PlaybookPanel
              deal={deal}
              onUpdate={handlePlaybookPanelUpdate}
              isUpdating={isUpdating}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DealFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        deal={deal}
        onSubmit={handleUpdateDeal}
        isLoading={isUpdating}
      />

      <InteractionFormDialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
        dealId={deal.id}
        contacts={dealContacts}
        onSubmit={handleLogInteraction}
        isLoading={isCreating}
        dealContext={{
          deal_name: deal.deal_name || 'Untitled Deal',
          account_name: deal.accounts?.name || 'Unknown Account',
          stage: deal.stage,
          playbook_name: deal.playbooks?.name,
        }}
      />

      <PlaybookRequiredModal
        open={playbookModalOpen}
        onClose={() => {
          setPlaybookModalOpen(false);
          setPendingStageChange(null);
        }}
        onConfirm={handlePlaybookConfirm}
        targetStage={pendingStageChange || ''}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}
