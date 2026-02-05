import { useState, useEffect } from 'react';
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
import { Loader2, Trash2, Upload, Image, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { SM_PLATFORMS, CONTENT_STATUSES, type ContentStatus } from '@/lib/socialMediaConstants';
import { useSMContentItems, type SMContentItem } from '@/hooks/useSMContentItems';
import { useSMAssets, type SMAsset } from '@/hooks/useSMAssets';
import type { SMCampaign } from '@/hooks/useSMCampaigns';
import { AssetUploader } from './AssetUploader';
import { AssetPicker } from './AssetPicker';
import { cn } from '@/lib/utils';

interface ContentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string | null;
  campaigns: SMCampaign[];
  contentItems: SMContentItem[];
}

export function ContentDetailDrawer({
  open,
  onOpenChange,
  contentId,
  campaigns,
  contentItems,
}: ContentDetailDrawerProps) {
  const { updateContentItem, deleteContentItem, isUpdating, isDeleting } = useSMContentItems();
  const { assets, uploadAsset, isUploading } = useSMAssets();
  
  const content = contentItems.find(c => c.id === contentId);
  const platformConfig = SM_PLATFORMS.find(p => p.value === content?.platform);
  const Icon = platformConfig?.icon;
  
  // Form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<ContentStatus>('idea');
  const [campaignId, setCampaignId] = useState<string>('none');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssetUploader, setShowAssetUploader] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  
  // Sync form with content
  useEffect(() => {
    if (content) {
      setTitle(content.title || '');
      setCaption(content.caption || '');
      setStatus(content.status);
      setCampaignId(content.campaign_id || 'none');
      setSelectedAssetIds(content.assets?.map(a => a.id) || []);
    }
  }, [content]);
  
  const handleClose = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };
  
  const handleSave = async () => {
    if (!contentId) return;
    
    await updateContentItem({
      id: contentId,
      title: title || undefined,
      caption: caption || undefined,
      status,
      campaign_id: campaignId !== 'none' ? campaignId : undefined,
      asset_ids: selectedAssetIds,
    });
    
    handleClose();
  };
  
  const handleDelete = async () => {
    if (!contentId) return;
    await deleteContentItem(contentId);
    setShowDeleteConfirm(false);
    handleClose();
  };
  
  const handleUpload = async (files: File[]) => {
    const newAssetIds: string[] = [];
    for (const file of files) {
      const newAsset = await uploadAsset(file);
      if (newAsset?.id) {
        newAssetIds.push(newAsset.id);
      }
    }
    setSelectedAssetIds(prev => [...prev, ...newAssetIds]);
  };
  
  const removeAsset = (assetId: string) => {
    setSelectedAssetIds(prev => prev.filter(id => id !== assetId));
  };
  
  // Get selected asset objects
  const selectedAssets = selectedAssetIds
    .map(id => assets.find(a => a.id === id))
    .filter(Boolean) as SMAsset[];
  
  if (!content) return null;
  
  const contentDate = content.override_date
    ? format(parseISO(content.override_date), 'EEEE, MMMM d, yyyy')
    : 'No date';
  
  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" style={{ color: platformConfig?.color }} />}
              Edit Content
            </SheetTitle>
            <SheetDescription>
              {platformConfig?.label} • {contentDate}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
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

            {/* Caption */}
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

            {/* Campaign */}
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
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

            {/* Media */}
            <div className="space-y-2">
              <Label>Media</Label>
              
              {/* Selected assets */}
              {selectedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedAssets.map((asset) => (
                    <div key={asset.id} className="relative group w-16 h-16">
                      <img
                        src={asset.thumbnail_url || asset.file_url}
                        alt="Media"
                        className="w-full h-full object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeAsset(asset.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add media buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssetUploader(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload New
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssetPicker(true)}
                >
                  <Image className="h-4 w-4 mr-1" />
                  From Library
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this content item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asset Uploader */}
      <AssetUploader
        open={showAssetUploader}
        onOpenChange={setShowAssetUploader}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      {/* Asset Picker */}
      <AssetPicker
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        selectedIds={selectedAssetIds}
        onSelect={setSelectedAssetIds}
      />
    </>
  );
}
