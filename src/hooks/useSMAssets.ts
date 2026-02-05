import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UsageDetail {
  content_id: string;
  date: string | null;
  title: string | null;
  platform: string | null;
}

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
  usage_count: number;
  usage_details: UsageDetail[];
}

export function useSMAssets() {
  const { workspaceId, profile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['sm-assets', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sm_assets')
        .select(`
          *,
          sm_content_assets (
            content_item_id,
            sm_content_items (
              id,
              override_date,
              title,
              platform,
              schedule_slot_id,
              sm_schedule_slots (
                scheduled_date
              )
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(a => {
        const contentAssets = (a as any).sm_content_assets || [];
        
        const usageDetails: UsageDetail[] = contentAssets
          .filter((ca: any) => ca.sm_content_items)
          .map((ca: any) => ({
            content_id: ca.content_item_id,
            date: ca.sm_content_items?.override_date || 
                  ca.sm_content_items?.sm_schedule_slots?.scheduled_date || null,
            title: ca.sm_content_items?.title || null,
            platform: ca.sm_content_items?.platform || null,
          }));
        
        return {
          id: a.id,
          workspace_id: a.workspace_id,
          asset_type: a.asset_type as 'image' | 'carousel' | 'video',
          file_url: a.file_url,
          thumbnail_url: a.thumbnail_url,
          tags: a.tags || [],
          notes: a.notes,
          created_by: a.created_by,
          created_at: a.created_at,
          usage_count: usageDetails.length,
          usage_details: usageDetails,
        } as SMAsset;
      });
    },
    enabled: !!workspaceId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!workspaceId) {
        throw new Error('Workspace not loaded. Please refresh the page.');
      }
      
      // Determine asset type
      const isVideo = file.type.startsWith('video/');
      const assetType = isVideo ? 'video' : 'image';
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${workspaceId}/${fileName}`;
      
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
          workspace_id: workspaceId,
          asset_type: assetType,
          file_url: urlData.publicUrl,
          thumbnail_url: isVideo ? null : urlData.publicUrl, // For images, thumbnail is same as file
          created_by: profile?.user_id ?? user?.id ?? null,
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
    onError: (error: any) => {
      console.error('Error uploading asset:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to upload asset');
      }
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
    onError: (error: any) => {
      console.error('Error updating asset:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to update asset');
      }
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
    onError: (error: any) => {
      console.error('Error deleting asset:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to delete asset');
      }
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
