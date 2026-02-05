import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SMPlatform, ContentStatus } from '@/lib/socialMediaConstants';

export interface SMContentItem {
  id: string;
  workspace_id: string;
  schedule_slot_id: string | null;
  campaign_id: string | null;
  platform: SMPlatform;
  title: string | null;
  caption: string | null;
  hashtags_suggested: string[];
  hashtags_saved: string[];
  status: ContentStatus;
  override_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assets?: { id: string; file_url: string; thumbnail_url: string | null; asset_type: string }[];
}

export interface CreateContentItemInput {
  schedule_slot_id?: string;
  campaign_id?: string;
  platform: SMPlatform;
  title?: string;
  caption?: string;
  hashtags_saved?: string[];
  status?: ContentStatus;
  override_date?: string;
  asset_ids?: string[];
}

export function useSMContentItems(dateRange?: { start: string; end: string }) {
  const { workspaceId, profile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['sm-content-items', workspaceId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('sm_content_items')
        .select(`
          *,
          sm_content_assets (
            asset_id,
            display_order,
            sm_assets (
              id,
              file_url,
              thumbnail_url,
              asset_type
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      // Filter by date range if provided (considering override_date)
      // This is handled client-side for now due to complex logic
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        platform: item.platform as SMPlatform,
        status: item.status as ContentStatus,
        hashtags_suggested: item.hashtags_suggested || [],
        hashtags_saved: item.hashtags_saved || [],
        assets: (item.sm_content_assets || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((ca: any) => ca.sm_assets)
          .filter(Boolean),
      })) as SMContentItem[];
    },
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateContentItemInput) => {
      // Create content item
      const { data, error } = await supabase
        .from('sm_content_items')
        .insert({
          workspace_id: workspaceId!,
          schedule_slot_id: input.schedule_slot_id || null,
          campaign_id: input.campaign_id || null,
          platform: input.platform,
          title: input.title || null,
          caption: input.caption || null,
          hashtags_saved: input.hashtags_saved || [],
          status: input.status || 'idea',
          override_date: input.override_date || null,
          created_by: profile?.user_id ?? user?.id ?? null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Link assets if provided
      if (input.asset_ids && input.asset_ids.length > 0) {
        const assetLinks = input.asset_ids.map((asset_id, idx) => ({
          content_item_id: data.id,
          asset_id,
          display_order: idx,
        }));
        
        const { error: linkError } = await supabase
          .from('sm_content_assets')
          .insert(assetLinks);
        
        if (linkError) throw linkError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-content-items'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
      toast.success('Content created');
    },
    onError: (error: any) => {
      console.error('Error creating content:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to create content');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, asset_ids, ...input }: Partial<CreateContentItemInput> & { id: string }) => {
      const updates: Record<string, unknown> = {};
      if (input.schedule_slot_id !== undefined) updates.schedule_slot_id = input.schedule_slot_id || null;
      if (input.campaign_id !== undefined) updates.campaign_id = input.campaign_id || null;
      if (input.platform !== undefined) updates.platform = input.platform;
      if (input.title !== undefined) updates.title = input.title || null;
      if (input.caption !== undefined) updates.caption = input.caption || null;
      if (input.hashtags_saved !== undefined) updates.hashtags_saved = input.hashtags_saved;
      if (input.status !== undefined) updates.status = input.status;
      if (input.override_date !== undefined) updates.override_date = input.override_date || null;

      const { data, error } = await supabase
        .from('sm_content_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update asset links if provided
      if (asset_ids !== undefined) {
        // Remove existing links
        await supabase
          .from('sm_content_assets')
          .delete()
          .eq('content_item_id', id);
        
        // Add new links
        if (asset_ids.length > 0) {
          const assetLinks = asset_ids.map((asset_id, idx) => ({
            content_item_id: id,
            asset_id,
            display_order: idx,
          }));
          
          await supabase
            .from('sm_content_assets')
            .insert(assetLinks);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-content-items'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
      toast.success('Content updated');
    },
    onError: (error: any) => {
      console.error('Error updating content:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to update content');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sm_content_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-content-items'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
      toast.success('Content deleted');
    },
    onError: (error: any) => {
      console.error('Error deleting content:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to delete content');
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContentStatus }) => {
      const { error } = await supabase
        .from('sm_content_items')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sm-content-items'] });
      queryClient.invalidateQueries({ queryKey: ['sm-calendar-data'] });
    },
    onError: (error: any) => {
      console.error('Error updating status:', error);
      if (error?.message?.includes('row level security')) {
        toast.error('Permission/workspace mismatch. Refresh and try again.');
      } else {
        toast.error('Failed to update status');
      }
    },
  });

  return {
    contentItems,
    isLoading,
    createContentItem: createMutation.mutateAsync,
    updateContentItem: updateMutation.mutateAsync,
    deleteContentItem: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
