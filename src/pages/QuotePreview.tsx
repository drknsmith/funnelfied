import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote, useQuoteContractorItems } from '@/hooks/useQuotes';
import {
  PHASES,
  laborSubtotal,
  contractorClientPrice,
  discountAmount,
  grandTotal,
  formatMoney,
  SERVICE_CATEGORY_LABELS,
  CONTRACTOR_TYPE_LABELS,
  SERVICE_DETAIL_FIELDS,
} from '@/lib/quoteCalculations';

export default function QuotePreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: quote } = useQuote(id);
  const { items } = useQuoteContractorItems(id);

  useEffect(() => {
    document.body.classList.add('quote-print-mode');
    return () => document.body.classList.remove('quote-print-mode');
  }, []);

  if (!quote) return <div className="p-6">Loading…</div>;
  const labor = laborSubtotal(quote);
  const disc = discountAmount(quote);
  const total = grandTotal(quote, items);
  const rate = Number(quote.hourly_rate) || 0;
  const detailFields = quote.service_category ? SERVICE_DETAIL_FIELDS[quote.service_category] ?? [] : [];

  const gapKeys: Record<string, string> = {
    programming: 'programming_gaps',
    design: 'compliance_drivers',
    policy: 'policy_status',
  };
  const problemStatement = quote.service_category
    ? quote.service_details?.[gapKeys[quote.service_category] ?? ''] ?? ''
    : '';

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-3 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => nav(`/quotes/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Editor
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="max-w-[8.5in] mx-auto my-6 bg-white text-slate-900 shadow print:shadow-none p-10 space-y-6">
        <header className="border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-red-700">RED LOFT CONSULTING</h1>
          <p className="text-xs text-slate-600 mt-1">Programming · Design · Policy</p>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Prepared For</p>
            <p className="font-medium">{quote.snapshot_contact_name || '—'}</p>
            <p className="text-slate-600">{quote.snapshot_contact_email}</p>
            <p className="text-slate-600">{quote.snapshot_contact_phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500">Project</p>
            <p className="font-medium">{quote.snapshot_project_name || '—'}</p>
            <p className="text-slate-600">{quote.snapshot_project_address}</p>
            <p className="text-slate-600 mt-1">Date: {new Date(quote.created_at).toLocaleDateString()}</p>
            <p className="text-slate-600">Quote v{quote.version_number}</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Problem Statement</h2>
          <p className="text-sm whitespace-pre-wrap">{problemStatement || 'Details to be finalized.'}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Proposed Approach</h2>
          <p className="text-sm">
            Red Loft engages this work through our Process &amp; Product framework, delivering a{' '}
            {SERVICE_CATEGORY_LABELS[quote.service_category ?? ''] ?? 'consulting'} engagement structured
            around clear phases, defined deliverables, and measurable outcomes.
          </p>
        </section>

        {detailFields.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Project Context</h2>
            <dl className="text-sm space-y-1">
              {detailFields.map((f) => {
                const v = quote.service_details?.[f.key];
                if (!v) return null;
                return (
                  <div key={f.key} className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd className="col-span-2">{String(v)}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {quote.timeline_urgency && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Timeline</h2>
            <p className="text-sm">{quote.timeline_urgency}</p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Investment</h2>
          <table className="w-full text-sm">
            <tbody>
              {PHASES.map((p) => {
                const hours = Number(quote[p.key]) || 0;
                if (hours === 0) return null;
                return (
                  <tr key={p.key} className="border-b">
                    <td className="py-2">{p.label}</td>
                    <td className="py-2 text-right">{formatMoney(hours * rate)}</td>
                  </tr>
                );
              })}
              {items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2">{CONTRACTOR_TYPE_LABELS[it.contractor_type] ?? it.contractor_type}</td>
                  <td className="py-2 text-right">{formatMoney(contractorClientPrice(it))}</td>
                </tr>
              ))}
              {disc > 0 && (
                <tr className="border-b">
                  <td className="py-2 text-slate-600">
                    Discount{quote.include_discount_reason_on_pdf && quote.discount_reason ? ` — ${quote.discount_reason}` : ''}
                  </td>
                  <td className="py-2 text-right text-slate-600">- {formatMoney(disc)}</td>
                </tr>
              )}
              <tr>
                <td className="pt-3 text-base font-semibold">Total</td>
                <td className="pt-3 text-right text-base font-semibold">{formatMoney(total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="pt-6 text-xs text-slate-500 border-t">
          Prepared by Red Loft Consulting. Quote valid for 30 days from date issued.
        </footer>
      </div>

      <style>{`
        @media print {
          body.quote-print-mode { background: white !important; }
          body.quote-print-mode nav, body.quote-print-mode aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}