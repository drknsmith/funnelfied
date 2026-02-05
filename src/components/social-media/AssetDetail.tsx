import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Image, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import type { SMAsset } from '@/hooks/useSMAssets';
import { useSMAssets } from '@/hooks/useSMAssets';
import { SM_PLATFORMS } from '@/lib/socialMediaConstants';

interface AssetDetailProps {
  asset: SMAsset | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function AssetDetail({ asset, onClose, onDelete }: AssetDetailProps) {
  const { updateAsset, isUpdating } = useSMAssets();
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (asset) {
      setTags(asset.tags.join(', '));
      setNotes(asset.notes || '');
    }
  }, [asset]);

  if (!asset) return null;

  const handleSave = async () => {
    await updateAsset({
      id: asset.id,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
    });
  };

  const handleDelete = async () => {
    await onDelete(asset.id);
    setShowDeleteConfirm(false);
  };

  const isVideo = asset.asset_type === 'video';

  const getPlatformIcon = (platformValue: string | null) => {
    if (!platformValue) return null;
    const platform = SM_PLATFORMS.find(p => p.value === platformValue);
    if (!platform) return null;
    const Icon = platform.icon;
    return <Icon className="h-4 w-4" style={{ color: platform.color }} />;
  };

  return (
    <Dialog open={!!asset} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isVideo ? <Video className="h-5 w-5" /> : <Image className="h-5 w-5" />}
            Asset Details
          </DialogTitle>
          <DialogDescription>
            Uploaded on {format(parseISO(asset.created_at), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {isVideo ? (
              <video
                src={asset.file_url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={asset.file_url}
                alt="Asset preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="capitalize">
              {asset.asset_type}
            </Badge>
            {asset.usage_count > 0 && (
              <Badge variant="outline">Used {asset.usage_count}x</Badge>
            )}
          </div>

          {/* Usage History */}
          {asset.usage_details && asset.usage_details.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <Label>Used In ({asset.usage_details.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {asset.usage_details.map((usage, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2 p-2 bg-muted rounded">
                    {getPlatformIcon(usage.platform)}
                    <span className="flex-1 truncate">
                      {usage.title || <span className="text-muted-foreground italic">Untitled</span>}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {usage.date ? format(parseISO(usage.date), 'MMM d, yyyy') : 'No date'}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this asset..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showDeleteConfirm ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Confirm Delete
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                Save Changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
