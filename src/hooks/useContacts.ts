import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  workspace_id: string;
  account_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role_type: string | null;
  linkedin_url: string | null;
  notes: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactWithAccount extends Contact {
  accounts?: { name: string } | null;
}

export function useContacts(accountId?: string) {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ['contacts', workspaceId, accountId, viewMode, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*, accounts(name)')
        .order('name');

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      // Filter by owner when in 'my' mode
      if (viewMode === 'my' && user?.id) {
        query = query.eq('owner_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactWithAccount[];
    },
    enabled: !!workspaceId,
  });

  const createContact = useMutation({
    mutationFn: async (input: Omit<Contact, 'id' | 'workspace_id' | 'created_at' | 'updated_at' | 'owner_user_id'>) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...input, workspace_id: workspaceId, owner_user_id: user?.id || null })
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact created' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to create contact', description: error.message });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact updated' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to update contact', description: error.message });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact deleted' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Failed to delete contact', description: error.message });
    },
  });

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact,
    updateContact,
    deleteContact,
  };
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('contacts')
        .select('*, accounts(name)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ContactWithAccount | null;
    },
    enabled: !!id,
  });
}
