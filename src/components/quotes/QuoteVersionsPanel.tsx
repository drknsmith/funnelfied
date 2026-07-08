import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuotes } from '@/hooks/useQuotes';

export function QuoteVersionsPanel({ dealId }: { dealId: string }) {
  const nav = useNavigate();
  const { quotes, isLoading } = useQuotes(dealId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Quotes</CardTitle>
        <Button size="sm" onClick={() => nav(`/quotes/new?dealId=${dealId}`)}>
          <Plus className="mr-1 h-4 w-4" /> New Quote
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