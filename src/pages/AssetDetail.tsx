import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAsset, ASSET_TYPES } from '@/hooks/useAssets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Loader2, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id);

  const getTypeLabel = (type: string) => {
    return ASSET_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/assets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Asset not found</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const assetLink = asset.asset_url || asset.asset_file_ref;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/assets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
          <Button onClick={() => navigate(`/assets/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Asset
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">{asset.name}</CardTitle>
              </div>
              <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                {asset.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Asset Type</p>
                <p className="text-foreground">{getTypeLabel(asset.asset_type)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Storage Method</p>
                <p className="text-foreground capitalize">{asset.storage_method}</p>
              </div>
            </div>

            {assetLink && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Asset Link</p>
                <a 
                  href={assetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {assetLink}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {asset.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{asset.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-foreground">{format(new Date(asset.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                <p className="text-foreground">{format(new Date(asset.updated_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
