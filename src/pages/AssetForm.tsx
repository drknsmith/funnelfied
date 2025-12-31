import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAssets, useAsset, ASSET_TYPES, uploadAssetFile } from '@/hooks/useAssets';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { createAsset, updateAsset } = useAssets();
  const { playbooks } = usePlaybooks();
  const { data: existingAsset, isLoading: isLoadingAsset } = useAsset(id);

  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [storageMethod, setStorageMethod] = useState<'url' | 'file'>('url');
  const [assetUrl, setAssetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (existingAsset) {
      setName(existingAsset.name);
      setAssetType(existingAsset.asset_type);
      setStorageMethod(existingAsset.storage_method as 'url' | 'file');
      setAssetUrl(existingAsset.asset_url || '');
      setDescription(existingAsset.description || '');
      setStatus(existingAsset.status as 'active' | 'archived');
      setSelectedPlaybooks(existingAsset.playbookIds || []);
    }
  }, [existingAsset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handlePlaybookToggle = (playbookId: string) => {
    setSelectedPlaybooks(prev => 
      prev.includes(playbookId) 
        ? prev.filter(id => id !== playbookId)
        : [...prev, playbookId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !assetType) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      let fileRef = existingAsset?.asset_file_ref || null;

      if (storageMethod === 'file' && file && profile?.workspace_id) {
        setIsUploading(true);
        fileRef = await uploadAssetFile(file, profile.workspace_id);
        setIsUploading(false);
      }

      const assetData = {
        name: name.trim(),
        asset_type: assetType,
        storage_method: storageMethod,
        asset_url: storageMethod === 'url' ? assetUrl : null,
        asset_file_ref: storageMethod === 'file' ? fileRef : null,
        description: description.trim() || null,
        status,
      };

      if (id && existingAsset) {
        await updateAsset.mutateAsync({ id, asset: assetData, playbookIds: selectedPlaybooks });
      } else {
        await createAsset.mutateAsync({ asset: assetData, playbookIds: selectedPlaybooks });
      }

      navigate('/assets');
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (id && isLoadingAsset) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit Asset' : 'Create New Asset'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Asset Type *</Label>
                <Select value={assetType} onValueChange={setAssetType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Related Playbooks</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                  {playbooks.map((playbook) => (
                    <div key={playbook.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`pb-${playbook.id}`}
                        checked={selectedPlaybooks.includes(playbook.id)}
                        onCheckedChange={() => handlePlaybookToggle(playbook.id)}
                      />
                      <Label htmlFor={`pb-${playbook.id}`} className="text-sm font-normal cursor-pointer">
                        {playbook.name}
                      </Label>
                    </div>
                  ))}
                  {playbooks.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No playbooks available</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Storage Method</Label>
                <RadioGroup 
                  value={storageMethod} 
                  onValueChange={(v) => setStorageMethod(v as 'url' | 'file')}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="url" id="storage-url" />
                    <Label htmlFor="storage-url" className="font-normal">URL</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="file" id="storage-file" />
                    <Label htmlFor="storage-file" className="font-normal">File Upload</Label>
                  </div>
                </RadioGroup>
              </div>

              {storageMethod === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="url">Asset URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="https://example.com/asset.pdf"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file">Asset File</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="max-w-xs"
                    />
                    {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
                    {existingAsset?.asset_file_ref && !file && (
                      <span className="text-sm text-muted-foreground">Current file uploaded</span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional short description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'archived')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {id ? 'Update Asset' : 'Create Asset'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
