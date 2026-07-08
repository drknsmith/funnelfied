import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DealFile {
  id: string;
  deal_id: string;
  workspace_id: string;
  file_type: 'proposal' | 'site_photo';
  file_ref: string;
  file_name: string;
  uploaded_at: string;
  uploaded_by: string | null;
}

export function useDealFiles(dealId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ['deal-files', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from('deal_files')
        .select('*')
        .eq('deal_id', dealId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as DealFile[];
    },
    enabled: !!dealId,
  });

  const uploadFile = useMutation({
    mutationFn: async ({ 
      dealId, 
      file, 
      fileType 
    }: { 
      dealId: string; 
      file: File; 
      fileType: 'proposal' | 'site_photo';
    }) => {
      if (!profile?.workspace_id) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.workspace_id}/${dealId}/${fileType}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deal-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error } = await supabase
        .from('deal_files')
        .insert({
          deal_id: dealId,
          workspace_id: profile.workspace_id,
          file_type: fileType,
          file_ref: fileName,
          file_name: file.name,
          uploaded_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DealFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-files'] });
      toast({ title: 'File uploaded' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to upload file', description: error.message });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (file: DealFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('deal-files')
        .remove([file.file_ref]);

      if (storageError) throw storageError;

      // Delete database record
      const { error } = await supabase
        .from('deal_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-files'] });
      toast({ title: 'File deleted' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to delete file', description: error.message });
    },
  });

  const getFileUrl = (fileRef: string) => {
    const { data } = supabase.storage.from('deal-files').getPublicUrl(fileRef);
    return data.publicUrl;
  };

  const proposalFiles = filesQuery.data?.filter((f) => f.file_type === 'proposal') ?? [];
  const sitePhotos = filesQuery.data?.filter((f) => f.file_type === 'site_photo') ?? [];

  return {
    files: filesQuery.data ?? [],
    proposalFiles,
    sitePhotos,
    isLoading: filesQuery.isLoading,
    uploadFile: uploadFile.mutate,
    deleteFile: deleteFile.mutate,
    isUploading: uploadFile.isPending,
    isDeleting: deleteFile.isPending,
    getFileUrl,
  };
}
