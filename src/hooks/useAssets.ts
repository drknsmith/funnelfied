import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Asset {
  id: string;
  workspace_id: string;
  name: string;
  asset_type: string;
  storage_method: 'url' | 'file';
  asset_url: string | null;
  asset_file_ref: string | null;
  description: string | null;
  status: 'active' | 'archived';
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetWithPlaybooks extends Asset {
  playbooks?: { id: string; name: string }[];
}

export type AssetInput = Omit<Asset, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'created_by_user_id' | 'updated_by_user_id'>;

export const ASSET_TYPES = [
  { value: 'brand_overview', label: 'Brand Overview' },
  { value: 'portfolio_standard', label: 'Portfolio Standard' },
  { value: 'spec_package', label: 'Spec Package' },
  { value: 'roi_framing', label: 'ROI Framing' },
  { value: 'case_narrative', label: 'Case Narrative' },
  { value: 'other', label: 'Other' },
] as const;

export function useAssets() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];

      // Get assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      // Get playbook relationships
      const assetIds = assetsData.map(a => a.id);
      if (assetIds.length === 0) return assetsData as AssetWithPlaybooks[];

      const { data: relations } = await supabase
        .from('asset_playbooks')
        .select('asset_id, playbook_id, playbooks(id, name)')
        .in('asset_id', assetIds);

      // Merge playbooks into assets
      const assetsWithPlaybooks = assetsData.map(asset => ({
        ...asset,
        playbooks: relations
          ?.filter(r => r.asset_id === asset.id)
          .map(r => (r.playbooks as unknown as { id: string; name: string })) || [],
      })) as AssetWithPlaybooks[];

      return assetsWithPlaybooks;
    },
    enabled: !!profile?.workspace_id,
  });

  const createAsset = useMutation({
    mutationFn: async ({ asset, playbookIds }: { asset: AssetInput; playbookIds: string[] }) => {
      if (!profile?.workspace_id || !user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assets')
        .insert({
          ...asset,
          workspace_id: profile.workspace_id,
          created_by_user_id: user.id,
          updated_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create playbook relations
      if (playbookIds.length > 0) {
        const relations = playbookIds.map(playbookId => ({
          asset_id: data.id,
          playbook_id: playbookId,
        }));
        await supabase.from('asset_playbooks').insert(relations);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating asset', description: error.message, variant: 'destructive' });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, asset, playbookIds }: { id: string; asset: Partial<AssetInput>; playbookIds: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assets')
        .update({ ...asset, updated_by_user_id: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update playbook relations
      await supabase.from('asset_playbooks').delete().eq('asset_id', id);
      if (playbookIds.length > 0) {
        const relations = playbookIds.map(playbookId => ({
          asset_id: id,
          playbook_id: playbookId,
        }));
        await supabase.from('asset_playbooks').insert(relations);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating asset', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting asset', description: error.message, variant: 'destructive' });
    },
  });

  return { assets, isLoading, error, createAsset, updateAsset, deleteAsset };
}

export function useAsset(id: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      // Get playbook relations
      if (data) {
        const { data: relations } = await supabase
          .from('asset_playbooks')
          .select('playbook_id')
          .eq('asset_id', id);

        return {
          ...data,
          playbookIds: relations?.map(r => r.playbook_id) || [],
        } as Asset & { playbookIds: string[] };
      }

      return null;
    },
    enabled: !!id && !!profile?.workspace_id,
  });
}

export async function uploadAssetFile(file: File, workspaceId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${workspaceId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('assets')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('assets')
    .getPublicUrl(fileName);

  return publicUrl;
}
