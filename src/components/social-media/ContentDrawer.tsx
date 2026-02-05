import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SM_PLATFORMS, CONTENT_STATUSES, type SMPlatform, type ContentStatus } from '@/lib/socialMediaConstants';
import { useSMContentItems } from '@/hooks/useSMContentItems';
import type { SMCampaign } from '@/hooks/useSMCampaigns';
import type { CalendarContentItem } from '@/hooks/useSMCalendarData';
import { ContentThumbnail } from './ContentThumbnail';
import { cn } from '@/lib/utils';

interface ContentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  selectedPlatform: SMPlatform | null;
  campaigns: SMCampaign[];
  contentItems: CalendarContentItem[];
}

export function ContentDrawer({
  open,
  onOpenChange,
  selectedDate,
  selectedPlatform,
  campaigns,
  contentItems,
}: ContentDrawerProps) {
  const { createContentItem, isCreating } = useSMContentItems();
  const [showForm, setShowForm] = useState(false);
  
  // Form state - multi-platform support
  const [title, setTitle] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SMPlatform[]>([]);
  const [campaignId, setCampaignId] = useState<string>('none');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<ContentStatus>('idea');

  const resetForm = () => {
    setTitle('');
    setSelectedPlatforms([]);
    setCampaignId('none');
    setCaption('');
    setStatus('idea');
    setShowForm(false);
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
    if (selectedPlatforms.length === 0 || !selectedDate) return;

    // Create content for each selected platform
    for (const platform of selectedPlatforms) {
      await createContentItem({
        platform,
        campaign_id: campaignId !== 'none' ? campaignId : undefined,
        title: title || undefined,
        caption: caption || undefined,
        status,
        override_date: selectedDate,
      });
    }

    resetForm();
  };

  // Filter content by selected platform if any
  const filteredContent = selectedPlatform
    ? contentItems.filter(c => c.platform === selectedPlatform)
    : contentItems;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : 'Schedule Content'}
          </SheetTitle>
          <SheetDescription>
            {selectedPlatform
              ? `Content for ${SM_PLATFORMS.find(p => p.value === selectedPlatform)?.label}`
              : 'View and add scheduled content'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Existing content */}
          {filteredContent.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Scheduled Content</h3>
              {filteredContent.map((item) => (
                <ContentThumbnail key={item.id} item={item} />
              ))}
            </div>
          )}

          {filteredContent.length > 0 && <Separator />}

          {/* Add content */}
          {showForm ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add Content</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Content title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write your caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                />
              </div>

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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedPlatforms.length === 0 || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Content {selectedPlatforms.length > 1 && `(${selectedPlatforms.length})`}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => {
              setShowForm(true);
              if (selectedPlatform) {
                setSelectedPlatforms([selectedPlatform]);
              }
            }} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
