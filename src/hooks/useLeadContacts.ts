import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;

export interface LeadContact {
  id: string;
  workspace_id: string;
  lead_id: string;
  contact_id: string;
  created_at: string;
  contact?: Contact;
}

export function useLeadContacts(leadId: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['lead-contacts', leadId],
    queryFn: async () => {
      if (!leadId || !profile?.workspace_id) return [];

      const { data, error } = await supabase
        .from('lead_contacts')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LeadContact[];
    },
    enabled: !!leadId && !!profile?.workspace_id,
  });
}

export function useLinkContactToLead() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, contactId }: { leadId: string; contactId: string }) => {
      if (!profile?.workspace_id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('lead_contacts')
        .insert({
          workspace_id: profile.workspace_id,
          lead_id: leadId,
          contact_id: contactId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Contact already linked to this lead');
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-contacts', data.lead_id] });
      toast.success('Contact linked to lead');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnlinkContactFromLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('lead_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { leadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead-contacts', data.leadId] });
      toast.success('Contact unlinked');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unlink contact: ${error.message}`);
    },
  });
}

// Create a contact from stakeholder data and link to lead
export function useCreateContactFromStakeholder() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      leadId,
      accountId,
      stakeholderName,
      email,
      phone,
      title,
      linkedinUrl,
      roleType,
    }: {
      leadId: string;
      accountId: string;
      stakeholderName: string;
      email?: string | null;
      phone?: string | null;
      title?: string | null;
      linkedinUrl?: string | null;
      roleType?: string | null;
    }) => {
      if (!profile?.workspace_id) throw new Error('No workspace');

      // Check if contact already exists by email in this workspace
      if (email) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('workspace_id', profile.workspace_id)
          .eq('email', email)
          .maybeSingle();

        if (existingContact) {
          // Link existing contact
          const { data: link, error: linkError } = await supabase
            .from('lead_contacts')
            .insert({
              workspace_id: profile.workspace_id,
              lead_id: leadId,
              contact_id: existingContact.id,
            })
            .select()
            .single();

          if (linkError && linkError.code !== '23505') throw linkError;
          return { action: 'linked' as const, contactId: existingContact.id };
        }
      }

      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          workspace_id: profile.workspace_id,
          account_id: accountId,
          name: stakeholderName,
          email: email || null,
          phone: phone || null,
          title: title || null,
          linkedin_url: linkedinUrl || null,
          role_type: roleType || null,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Link to lead
      const { error: linkError } = await supabase
        .from('lead_contacts')
        .insert({
          workspace_id: profile.workspace_id,
          lead_id: leadId,
          contact_id: newContact.id,
        });

      if (linkError && linkError.code !== '23505') throw linkError;

      return { action: 'created' as const, contactId: newContact.id };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-contacts', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(
        result.action === 'created'
          ? 'Contact created and linked to lead'
          : 'Existing contact linked to lead'
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });
}
