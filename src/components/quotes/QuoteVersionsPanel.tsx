import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuotes } from '@/hooks/useQuotes';
import { useDeals } from '@/hooks/useDeals';
import { useContacts } from '@/hooks/useContacts';

export function QuoteVersionsPanel({ dealId }: { dealId: string }) {
  const nav = useNavigate();
  const { quotes, isLoading } = useQuotes(dealId);
  const { createQuote, isCreating } = useQuotes();
  const { deals } = useDeals();
  const { contacts } = useContacts();

  const handleNew = async () => {
    const deal: any = deals.find((d: any) => d.id === dealId);
    if (!deal) {
      nav(`/quotes/new?dealId=${dealId}`);
      return;
    }
    const contact: any = contacts.find((c: any) => c.id === deal.primary_contact_id);
    const projectAddress = [deal.project_street, deal.project_city, deal.project_state, deal.project_zip]
      .filter(Boolean)
      .join(', ');
    const quote = await createQuote({
      deal_id: deal.id,
      contact_id: deal.primary_contact_id ?? null,
      service_category: (deal.deal_type as string[] | null) ?? null,
      snapshot: {
        snapshot_contact_name: contact?.name ?? null,
        snapshot_contact_email: contact?.email ?? null,
        snapshot_contact_phone: contact?.phone ?? null,
        snapshot_referral_source: contact?.referred_by ?? null,
        snapshot_project_name: deal.deal_name ?? null,
        snapshot_project_address: projectAddress || null,
      },
    });
    nav(`/quotes/${quote.id}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Quotes</CardTitle>
        <Button size="sm" onClick={handleNew} disabled={isCreating}>
          <Plus className="mr-1 h-4 w-4" /> {isCreating ? 'Creating…' : 'New Quote'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : quotes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
            No quotes yet.
          </div>
        ) : (
          <div className="divide-y">
            {quotes.map((q: any) => (
              <Link
                key={q.id}
                to={`/quotes/${q.id}`}
                className="flex items-center justify-between py-2 px-1 hover:bg-muted/40 rounded"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{q.version_number}</Badge>
                  <Badge>{q.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(q.updated_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}