import { Image, Video, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SMAsset } from '@/hooks/useSMAssets';
import { format, parseISO } from 'date-fns';

interface AssetGridProps {
  assets: SMAsset[];
  onAssetClick: (asset: SMAsset) => void;
}

export function AssetGrid({ assets, onAssetClick }: AssetGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="group relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={() => onAssetClick(asset)}
        >
          {/* Thumbnail */}
          {asset.thumbnail_url ? (
            <img
              src={asset.thumbnail_url}
              alt="Asset thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {asset.asset_type === 'video' ? (
                <Video className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Video indicator */}
          {asset.asset_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="h-5 w-5 text-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Type badge */}
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-xs capitalize"
          >
            {asset.asset_type}
          </Badge>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
            <div className="p-2 w-full">
              <p className="text-xs text-white truncate">
                {format(parseISO(asset.created_at), 'MMM d, yyyy')}
              </p>
              {asset.tags.length > 0 && (
                <p className="text-xs text-white/70 truncate">
                  {asset.tags.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
