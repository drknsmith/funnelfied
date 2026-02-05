import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SMAsset {
  id: string;
  workspace_id: string;
  asset_type: 'image' | 'carousel' | 'video';
  file_url: string;
  thumbnail_url: string | null;
  tags: string[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useSMAssets() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['sm-assets', profile?.workspace_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sm_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(a => ({
        ...a,
        asset_type: a.asset_type as 'image' | 'carousel' | 'video',
        tags: a.tags || [],
      })) as SMAsset[];
    },
    enabled: !!profile?.workspace_id,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Determine asset type
      const isVideo = file.type.startsWith('video/');
      const assetType = isVideo ? 'video' : 'image';
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${profile!.workspace_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sm-assets')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sm-assets')
        .getPublicUrl(filePath);
      
      // Create database record
      const { data, error } = await supabase
        .from('sm_assets')
        .insert({
          workspace_id: profile!.workspace_id,
          asset_type: assetType,
          file_url: urlData.publicUrl,
          thumbnail_url: isVideo ? null : urlData.publicUrl, // For images, thumbnail is same as file
          created_by: profile!.user_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-assets'] });
      toast.success('Asset uploaded');
    },
    onError: (error) => {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, tags, notes }: { id: string; tags?: string[]; notes?: string }) => {
      const updates: Record<string, unknown> = {};
      if (tags !== undefined) updates.tags = tags;
      if (notes !== undefined) updates.notes = notes || null;

      const { data, error } = await supabase
        .from('sm_assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-assets'] });
      toast.success('Asset updated');
    },
    onError: (error) => {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get asset to delete from storage
      const asset = assets.find(a => a.id === id);
      if (asset) {
        const path = new URL(asset.file_url).pathname.split('/sm-assets/')[1];
        if (path) {
          await supabase.storage.from('sm-assets').remove([path]);
        }
      }
      
      const { error } = await supabase
        .from('sm_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-assets'] });
      toast.success('Asset deleted');
    },
    onError: (error) => {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    },
  });

  return {
    assets,
    isLoading,
    uploadAsset: uploadMutation.mutateAsync,
    updateAsset: updateMutation.mutateAsync,
    deleteAsset: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
