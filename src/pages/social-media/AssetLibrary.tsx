import { useState, useCallback } from 'react';
import { Plus, Loader2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssetGrid } from '@/components/social-media/AssetGrid';
import { AssetUploader } from '@/components/social-media/AssetUploader';
import { AssetDetail } from '@/components/social-media/AssetDetail';
import { useSMAssets, type SMAsset } from '@/hooks/useSMAssets';

export default function AssetLibrary() {
  const { assets, isLoading, uploadAsset, deleteAsset, isUploading } = useSMAssets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<SMAsset | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  // Filter assets by search query (tags or notes)
  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.tags.some(tag => tag.toLowerCase().includes(query)) ||
      asset.notes?.toLowerCase().includes(query)
    );
  });

  const handleUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      await uploadAsset(file);
    }
    setUploaderOpen(false);
  }, [uploadAsset]);

  const handleDelete = async (id: string) => {
    await deleteAsset(id);
    setSelectedAsset(null);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-muted-foreground">
            Upload and manage your media assets
          </p>
        </div>
        <Button onClick={() => setUploaderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tags or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No assets match your search' : 'No assets uploaded yet'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setUploaderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload your first asset
            </Button>
          )}
        </div>
      ) : (
        <AssetGrid
          assets={filteredAssets}
          onAssetClick={setSelectedAsset}
        />
      )}

      {/* Upload Dialog */}
      <AssetUploader
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      {/* Asset Detail Modal */}
      <AssetDetail
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
