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
  useEffect(() => setDealId(preselectDealId), [preselectDealId]);

  const deal = useMemo(() => deals.find((d: any) => d.id === dealId), [deals, dealId]);
  const contact = useMemo(
    () => contacts.find((c: any) => c.id === (deal as any)?.primary_contact_id),
    [contacts, deal]
  );

  const handleCreate = async () => {
    if (!deal) return;
    const projectAddress = [
      (deal as any).project_street,
      (deal as any).project_city,
      (deal as any).project_state,
      (deal as any).project_zip,
    ]
      .filter(Boolean)
      .join(', ');
    const quote = await createQuote({
      deal_id: (deal as any).id,
      contact_id: (deal as any).primary_contact_id ?? null,
      service_category: (deal as any).deal_type ?? null,
      cloneFromId,
      snapshot: {
        snapshot_contact_name: (contact as any)?.name ?? null,
        snapshot_contact_email: (contact as any)?.email ?? null,
        snapshot_contact_phone: (contact as any)?.phone ?? null,
        snapshot_referral_source: (contact as any)?.referred_by ?? null,
        snapshot_project_name: (deal as any).deal_name ?? null,
        snapshot_project_address: projectAddress || null,
      },
    });
    nav(`/quotes/${quote.id}`);
  };

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
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => nav('/quotes')}>Cancel</Button>
              <Button disabled={!dealId || isCreating} onClick={handleCreate}>
                {isCreating ? 'Creating…' : 'Create Quote'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}