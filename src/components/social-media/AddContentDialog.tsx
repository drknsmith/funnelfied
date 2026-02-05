import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { SM_PLATFORMS, CONTENT_STATUSES, type SMPlatform, type ContentStatus } from '@/lib/socialMediaConstants';
import { useSMContentItems } from '@/hooks/useSMContentItems';
import type { SMCampaign } from '@/hooks/useSMCampaigns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AddContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: SMCampaign[];
}

export function AddContentDialog({
  open,
  onOpenChange,
  campaigns,
}: AddContentDialogProps) {
  const { workspaceId } = useAuth();
  const { createContentItem, isCreating } = useSMContentItems();
  
  // Form state
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SMPlatform[]>([]);
  const [campaignId, setCampaignId] = useState<string>('none');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<ContentStatus>('idea');

  const resetForm = () => {
    setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
    setTitle('');
    setSelectedPlatforms([]);
    setCampaignId('none');
    setCaption('');
    setStatus('idea');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const togglePlatform = (platform: SMPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async () => {
    if (selectedPlatforms.length === 0 || !scheduledDate) return;

    // Create content for each selected platform
    for (const platform of selectedPlatforms) {
      await createContentItem({
        platform,
        campaign_id: campaignId !== 'none' ? campaignId : undefined,
        title: title || undefined,
        caption: caption || undefined,
        status,
        override_date: scheduledDate,
      });
    }

    handleClose();
  };

  const canSubmit = selectedPlatforms.length > 0 && scheduledDate && workspaceId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Create new content for one or more platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date picker - required */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Scheduled Date *</Label>
            <Input
              id="scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          {/* Platform toggles */}
          <div className="space-y-2">
            <Label>Platforms *</Label>
            <div className="flex flex-wrap gap-2">
              {SM_PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlatforms.includes(p.value);
                return (
                  <Button
                    key={p.value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={cn(
                      "gap-1.5",
                      isSelected && "ring-2 ring-offset-1"
                    )}
                    style={isSelected ? { 
                      backgroundColor: p.color,
                      borderColor: p.color,
                    } : undefined}
                  >
                    <Icon className="h-4 w-4" style={!isSelected ? { color: p.color } : undefined} />
                    {p.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more platforms. Content will be duplicated for each.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Content title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign (Optional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write your caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Content {selectedPlatforms.length > 1 && `(${selectedPlatforms.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
