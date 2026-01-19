import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';

export type InteractionSourceType = 'deal' | 'contact';

export interface AllInteraction {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
  source_type: InteractionSourceType;
  source_id: string;
  source_name: string;
  account_id: string | null;
  account_name: string | null;
  owner_user_id: string | null;
}

export function useAllInteractions() {
  const { workspaceId, user } = useAuth();
  const { viewMode } = useViewMode();

  return useQuery({
    queryKey: ['all-interactions', workspaceId, viewMode, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          id,
          type,
          summary,
          occurred_at,
          deal_id,
          contact_id,
          deals(id, deal_name, owner_user_id, account_id, accounts(id, name)),
          contacts(id, name, owner_user_id, account_id, accounts(id, name))
        `)
        .order('occurred_at', { ascending: false });

      if (error) throw error;

      const interactions: AllInteraction[] = [];

      for (const row of data || []) {
        // Determine the source (deal or contact)
        const deal = row.deals as any;
        const contact = row.contacts as any;

        let sourceType: InteractionSourceType;
        let sourceId: string;
        let sourceName: string;
        let accountId: string | null = null;
        let accountName: string | null = null;
        let ownerUserId: string | null = null;

        if (deal) {
          sourceType = 'deal';
          sourceId = deal.id;
          sourceName = deal.deal_name || deal.accounts?.name || 'Unknown Deal';
          accountId = deal.account_id;
          accountName = deal.accounts?.name || null;
          ownerUserId = deal.owner_user_id;
        } else if (contact) {
          sourceType = 'contact';
          sourceId = contact.id;
          sourceName = contact.name || 'Unknown Contact';
          accountId = contact.account_id;
          accountName = contact.accounts?.name || null;
          ownerUserId = contact.owner_user_id;
        } else {
          // Skip interactions without valid source
          continue;
        }

        // Filter by owner in 'my' mode
        if (viewMode === 'my' && user?.id && ownerUserId !== user.id) {
          continue;
        }

        interactions.push({
          id: row.id,
          type: row.type,
          summary: row.summary,
          occurred_at: row.occurred_at,
          source_type: sourceType,
          source_id: sourceId,
          source_name: sourceName,
          account_id: accountId,
          account_name: accountName,
          owner_user_id: ownerUserId,
        });
      }

      return interactions;
    },
    enabled: !!workspaceId,
  });
}
