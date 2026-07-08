import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';
import { useQuotes } from '@/hooks/useQuotes';

export default function QuoteNew() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const preselectDealId = sp.get('dealId') ?? '';
  const cloneFromId = sp.get('cloneFrom') ?? undefined;

  const { deals } = useDeals();
  const { contacts } = useContacts();
  const { createQuote, isCreating } = useQuotes();

  const [dealId, setDealId] = useState(preselectDealId);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  useEffect(() => setDealId(preselectDealId), [preselectDealId]);

  const deal = useMemo(() => deals.find((d: any) => d.id === dealId), [deals, dealId]);
  const contact = useMemo(
    () => contacts.find((c: any) => c.id === (deal as any)?.primary_contact_id),
    [contacts, deal]
  );

  const handleCreate = async (targetDeal = deal) => {
    if (!targetDeal) return;
    const activeContact = contacts.find((c: any) => c.id === (targetDeal as any).primary_contact_id);
    const projectAddress = [
      (targetDeal as any).project_street,
      (targetDeal as any).project_city,
      (targetDeal as any).project_state,
      (targetDeal as any).project_zip,
    ]
      .filter(Boolean)
      .join(', ');
    const quote = await createQuote({
      deal_id: (targetDeal as any).id,
      contact_id: (targetDeal as any).primary_contact_id ?? null,
      service_category: (targetDeal as any).deal_type ?? null,
      cloneFromId,
      snapshot: {
        snapshot_contact_name: (activeContact as any)?.name ?? null,
        snapshot_contact_email: (activeContact as any)?.email ?? null,
        snapshot_contact_phone: (activeContact as any)?.phone ?? null,
        snapshot_referral_source: (activeContact as any)?.referred_by ?? null,
        snapshot_project_name: (targetDeal as any).deal_name ?? null,
        snapshot_project_address: projectAddress || null,
      },
    });
    nav(`/quotes/${quote.id}`);
  };

  // Auto-create as soon as an Opportunity is selected (including preselected from URL)
  useEffect(() => {
    if (!deal) return;
    if (isCreating) return;
    if (creatingFor === (deal as any).id) return;
    setCreatingFor((deal as any).id);
    handleCreate(deal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal]);

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>New Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Opportunity</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Pick an Opportunity — the quote opens with all inputs on the next screen.
              </p>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger><SelectValue placeholder="Select an opportunity" /></SelectTrigger>
                <SelectContent>
                  {deals.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.deal_name || d.accounts?.name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {deal && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Service Category: <strong>{(deal as any).deal_type || '—'}</strong></p>
                <p>Contact: {(contact as any)?.name || '—'}</p>
                <p className="italic">Creating draft quote…</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => nav('/quotes')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}