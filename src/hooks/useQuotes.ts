import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Quote {
  id: string;
  workspace_id: string;
  owner_user_id: string | null;
  deal_id: string;
  contact_id: string | null;
  version_number: number;
  status: string;
  service_category: string | null;
  engagement_type: string | null;
  timeline_urgency: string | null;
  decision_maker_count: number | null;
  service_details: Record<string, any>;
  hourly_rate: number;
  phase_consultation_hours: number;
  phase_concept_hours: number;
  phase_revisions_hours: number;
  phase_revisions_rounds: number;
  phase_sourcing_hours: number;
  phase_pm_hours: number;
  phase_handoff_hours: number;
  discount_type: string | null;
  discount_value: number;
  discount_reason: string | null;
  include_discount_reason_on_pdf: boolean;
  snapshot_contact_name: string | null;
  snapshot_contact_email: string | null;
  snapshot_contact_phone: string | null;
  snapshot_referral_source: string | null;
  snapshot_project_name: string | null;
  snapshot_project_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteContractorItem {
  id: string;
  quote_id: string;
  workspace_id: string;
  contractor_type: string;
  vendor_name: string | null;
  flat_fee: number;
  markup_percentage: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useQuotes(dealId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['quotes', profile?.workspace_id, dealId ?? 'all'],
    queryFn: async () => {
      let q = (supabase as any)
        .from('quotes')
        .select('*, deals(id, deal_name, accounts(name))')
        .order('created_at', { ascending: false });
      if (dealId) q = q.eq('deal_id', dealId);
      const { data, error } = await q;
      if (error) throw error;
      return data as (Quote & { deals?: any })[];
    },
    enabled: !!profile?.workspace_id,
  });

  const createQuote = useMutation({
    mutationFn: async (payload: {
      deal_id: string;
      contact_id?: string | null;
      service_category?: string | null;
      snapshot?: Partial<Quote>;
      cloneFromId?: string;
    }) => {
      if (!profile?.workspace_id) throw new Error('No workspace');
      const { data: { user } } = await supabase.auth.getUser();

      // Determine next version number for this deal
      const { data: existing } = await (supabase as any)
        .from('quotes')
        .select('version_number')
        .eq('deal_id', payload.deal_id)
        .order('version_number', { ascending: false })
        .limit(1);
      const nextVersion = ((existing?.[0]?.version_number as number) ?? 0) + 1;

      let base: Partial<Quote> = {};
      let cloneItems: QuoteContractorItem[] = [];
      if (payload.cloneFromId) {
        const { data: src } = await (supabase as any)
          .from('quotes')
          .select('*')
          .eq('id', payload.cloneFromId)
          .single();
        if (src) base = src;
        const { data: srcItems } = await (supabase as any)
          .from('quote_contractor_items')
          .select('*')
          .eq('quote_id', payload.cloneFromId);
        cloneItems = (srcItems ?? []) as QuoteContractorItem[];
      }

      const insertRow = {
        ...base,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        workspace_id: profile.workspace_id,
        owner_user_id: user?.id ?? null,
        deal_id: payload.deal_id,
        contact_id: payload.contact_id ?? base.contact_id ?? null,
        version_number: nextVersion,
        status: 'draft',
        service_category: payload.service_category ?? base.service_category ?? null,
        ...(payload.snapshot ?? {}),
      };

      const { data: inserted, error } = await (supabase as any)
        .from('quotes')
        .insert(insertRow)
        .select()
        .single();
      if (error) throw error;

      if (cloneItems.length) {
        const rows = cloneItems.map((i) => ({
          quote_id: inserted.id,
          workspace_id: profile.workspace_id,
          contractor_type: i.contractor_type,
          vendor_name: i.vendor_name,
          flat_fee: i.flat_fee,
          markup_percentage: i.markup_percentage,
          sort_order: i.sort_order,
        }));
        await (supabase as any).from('quote_contractor_items').insert(rows);
      }

      return inserted as Quote;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Quote created' });
    },
    onError: (e: any) =>
      toast({ variant: 'destructive', title: 'Failed to create quote', description: e.message }),
  });

  const updateQuote = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Quote> }) => {
      const { data, error } = await (supabase as any)
        .from('quotes')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Quote;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
    onError: (e: any) =>
      toast({ variant: 'destructive', title: 'Save failed', description: e.message }),
  });

  const deleteQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: 'Quote deleted' });
    },
  });

  return {
    quotes: list.data ?? [],
    isLoading: list.isLoading,
    createQuote: createQuote.mutateAsync,
    updateQuote: updateQuote.mutate,
    deleteQuote: deleteQuote.mutate,
    isCreating: createQuote.isPending,
  };
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quotes')
        .select('*, deals(id, deal_name, accounts(name)), contacts(name, email, phone)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Quote & { deals?: any; contacts?: any };
    },
    enabled: !!id,
  });
}

export function useQuoteContractorItems(quoteId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['quote-contractor-items', quoteId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quote_contractor_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order');
      if (error) throw error;
      return data as QuoteContractorItem[];
    },
    enabled: !!quoteId,
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!profile?.workspace_id || !quoteId) throw new Error('missing context');
      const { data, error } = await (supabase as any)
        .from('quote_contractor_items')
        .insert({
          quote_id: quoteId,
          workspace_id: profile.workspace_id,
          contractor_type: 'fitness_equipment',
          sort_order: (list.data?.length ?? 0),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote-contractor-items', quoteId] }),
    onError: (e: any) => toast({ variant: 'destructive', title: 'Add failed', description: e.message }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<QuoteContractorItem> }) => {
      const { error } = await (supabase as any)
        .from('quote_contractor_items')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote-contractor-items', quoteId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('quote_contractor_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote-contractor-items', quoteId] }),
  });

  return {
    items: list.data ?? [],
    isLoading: list.isLoading,
    addItem: addItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
  };
}