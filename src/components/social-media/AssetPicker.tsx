import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Image, Video, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSMAssets, type SMAsset } from '@/hooks/useSMAssets';

interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelect: (assetIds: string[]) => void;
  multiple?: boolean;
}

export function AssetPicker({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
  multiple = true,
}: AssetPickerProps) {
  const { assets, isLoading } = useSMAssets();
  const [selected, setSelected] = useState<string[]>(selectedIds);

  // Sync with external state when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(selectedIds);
    }
  }, [open, selectedIds]);

  const toggleAsset = (assetId: string) => {
    if (multiple) {
      setSelected(prev =>
        prev.includes(assetId)
          ? prev.filter(id => id !== assetId)
          : [...prev, assetId]
      );
    } else {
      setSelected([assetId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelected(selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            {multiple
              ? 'Select one or more assets from your library'
              : 'Select an asset from your library'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assets in your library yet.</p>
              <p className="text-sm">Upload assets in the Asset Library tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {assets.map((asset) => {
                const isSelected = selected.includes(asset.id);
                const isVideo = asset.asset_type === 'video';

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    {/* Thumbnail */}
                    {asset.thumbnail_url || asset.file_url ? (
                      <img
                        src={asset.thumbnail_url || asset.file_url}
                        alt="Asset"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        {isVideo ? (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Video indicator */}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}

                    {/* Type badge */}
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-xs capitalize"
                    >
                      {asset.asset_type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={assets.length === 0}>
            Select ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
