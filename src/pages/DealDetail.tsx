import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useDeal, useDeals, DEAL_STAGES, DEAL_SIZES, DEAL_TYPES } from '@/hooks/useDeals';
import { useInteractions } from '@/hooks/useInteractions';
import { useContacts } from '@/hooks/useContacts';
import StageTimeline from '@/components/deals/StageTimeline';
import InteractionList from '@/components/deals/InteractionList';
import InteractionFormDialog from '@/components/deals/InteractionFormDialog';
import DealFormDialog from '@/components/deals/DealFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deal, isLoading } = useDeal(id!);
  const { updateDeal, deleteDeal, isUpdating, isDeleting } = useDeals();
  const { interactions, createInteraction, deleteInteraction, isCreating, isDeleting: isDeletingInteraction } = useInteractions(id);
  const { contacts } = useContacts();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
  const typeLabel = DEAL_TYPES.find((t) => t.value === deal.deal_type)?.label || deal.deal_type;
  const dealContacts = contacts.filter((c) => c.account_id === deal.account_id);

  const handleStageChange = (newStage: string) => {
    updateDeal({ id: deal.id, stage: newStage, last_meaningful_activity_date: new Date().toISOString().split('T')[0] });
  };

  const handleUpdateDeal = (data: any) => {
    updateDeal({ id: deal.id, ...data });
    setEditDialogOpen(false);
  };

  const handleDeleteDeal = () => {
    deleteDeal(deal.id);
    navigate('/deals');
  };

  const handleLogInteraction = (data: any) => {
    createInteraction(data);
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
                  {deal.accounts?.name || 'No Account'}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground">{stageLabel}</p>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Deal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div>
                  <p className="text-xs text-muted-foreground">Deal Size</p>
                  <p className="text-sm font-medium">{sizeLabel || '-'}</p>
                </div>
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

          {/* Interactions */}
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
