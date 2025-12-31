import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAssets, AssetWithPlaybooks, ASSET_TYPES } from '@/hooks/useAssets';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FileBox, Loader2, ExternalLink, Archive } from 'lucide-react';
import { format } from 'date-fns';

export default function Assets() {
  const navigate = useNavigate();
  const { assets, isLoading, deleteAsset, updateAsset } = useAssets();
  const { playbooks } = usePlaybooks();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [playbookFilter, setPlaybookFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesPlaybook = playbookFilter === 'all' || 
        asset.playbooks?.some(p => p.id === playbookFilter);
      return matchesSearch && matchesType && matchesStatus && matchesPlaybook;
    });
  }, [assets, search, typeFilter, statusFilter, playbookFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAsset.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleArchive = async (asset: AssetWithPlaybooks) => {
    await updateAsset.mutateAsync({
      id: asset.id,
      asset: { status: asset.status === 'active' ? 'archived' : 'active' },
      playbookIds: asset.playbooks?.map(p => p.id) || [],
    });
  };

  const getTypeLabel = (type: string) => {
    return ASSET_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assets</h1>
            <p className="text-muted-foreground">
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => navigate('/assets/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Asset
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={playbookFilter} onValueChange={setPlaybookFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Playbook" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Playbooks</SelectItem>
              {playbooks.map((pb) => (
                <SelectItem key={pb.id} value={pb.id}>{pb.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBox className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No assets yet</p>
              <p className="mb-4 text-muted-foreground">Create your first asset to get started</p>
              <Button onClick={() => navigate('/assets/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Playbooks</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Updated</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground">{asset.name}</div>
                        {asset.asset_url && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {asset.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {asset.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {getTypeLabel(asset.asset_type)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {asset.playbooks?.slice(0, 2).map((pb) => (
                          <Badge key={pb.id} variant="secondary" className="text-xs">
                            {pb.name}
                          </Badge>
                        ))}
                        {(asset.playbooks?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(asset.playbooks?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}`); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            View/Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(asset); }}>
                            <Archive className="mr-2 h-4 w-4" />
                            {asset.status === 'active' ? 'Archive' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteId(asset.id); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this asset. Playbooks referencing this asset will need to be updated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
