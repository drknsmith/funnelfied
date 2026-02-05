import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampaignList } from '@/components/social-media/CampaignList';
import { CampaignForm } from '@/components/social-media/CampaignForm';
import { useSMCampaigns, type SMCampaign } from '@/hooks/useSMCampaigns';
import { useAuth } from '@/contexts/AuthContext';

export default function Campaigns() {
  const { workspaceId } = useAuth();
  const { campaigns, isLoading, deleteCampaign, toggleActive } = useSMCampaigns();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SMCampaign | null>(null);

  const handleEdit = (campaign: SMCampaign) => {
    setEditingCampaign(campaign);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCampaign(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your recurring social media campaigns
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} disabled={!workspaceId}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign List */}
      <CampaignList
        campaigns={campaigns}
        onEdit={handleEdit}
        onDelete={deleteCampaign}
        onToggleActive={toggleActive}
      />

      {/* Campaign Form Dialog */}
      <CampaignForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        campaign={editingCampaign}
      />
    </div>
  );
}
