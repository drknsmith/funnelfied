import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuotes } from '@/hooks/useQuotes';
import {
  contractorSubtotal,
  discountAmount,
  formatMoney,
  grandTotal,
  laborSubtotal,
  SERVICE_CATEGORY_LABELS,
} from '@/lib/quoteCalculations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function QuoteRowTotal({ quoteId, ...quote }: any) {
  const { data: items = [] } = useQuery({
    queryKey: ['quote-contractor-items', quoteId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('quote_contractor_items')
        .select('*')
        .eq('quote_id', quoteId);
      return data ?? [];
    },
  });
  return <span className="font-medium">{formatMoney(grandTotal(quote, items))}</span>;
}

export default function Quotes() {
  const navigate = useNavigate();
  const { quotes, isLoading } = useQuotes();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Quote Tool</h1>
            <p className="text-sm text-muted-foreground">
              Generate versioned consulting quotes tied to opportunities.
            </p>
          </div>
          <Button onClick={() => navigate('/quotes/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : quotes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No quotes yet. Create one from an Opportunity.</p>
              </div>
            ) : (
              <div className="divide-y">
                {quotes.map((q: any) => (
                  <button
                    key={q.id}
                    onClick={() => navigate(`/quotes/${q.id}`)}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-muted/40 px-2 rounded"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {q.deals?.deal_name || q.deals?.accounts?.name || 'Untitled Opportunity'}
                        </span>
                        <Badge variant="outline">v{q.version_number}</Badge>
                        {q.service_category && (
                          <Badge variant="secondary">
                            {SERVICE_CATEGORY_LABELS[q.service_category] ?? q.service_category}
                          </Badge>
                        )}
                        <Badge>{q.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(q.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <QuoteRowTotal quoteId={q.id} {...q} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}