import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote, useQuoteContractorItems } from '@/hooks/useQuotes';
import logoAsset from '@/assets/red-loft-logo.png.asset.json';
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
  const [params] = useSearchParams();
  const doc = params.get('doc') === 'invoice' ? 'invoice' : 'sow';
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
  const categories = quote.service_category ?? [];
  const visiblePhases = PHASES.filter(
    (p) => !('requiresCategory' in p) || categories.includes((p as any).requiresCategory),
  );

  const gapKeys: Record<string, string> = {
    programming: 'programming_gaps',
    design: 'compliance_drivers',
    policy: 'policy_status',
  };
  const problemStatement = categories
    .map((c) => (quote.service_details?.[c] as any)?.[gapKeys[c]])
    .filter(Boolean)
    .join('\n\n');
  const approachLabel = categories.length
    ? categories.map((c) => SERVICE_CATEGORY_LABELS[c] ?? c).join(' + ')
    : 'consulting';

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
          <img src={logoAsset.url} alt="Red Loft Consulting" className="h-28 w-auto" />
          <p className="text-xs text-slate-600 mt-2">
            {doc === 'invoice' ? 'Invoice' : 'Statement of Work'} · Programming · Design · Policy
          </p>
        </header>

        <section className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Red Loft Contact</p>
            <p className="font-medium">{quote.redloft_contact_name || '—'}</p>
            {quote.redloft_contact_title && <p className="text-slate-600">{quote.redloft_contact_title}</p>}
            <p className="text-slate-600">{quote.redloft_contact_email}</p>
            <p className="text-slate-600">{quote.redloft_contact_phone}</p>
          </div>
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
            <p className="text-slate-600">{doc === 'invoice' ? 'Invoice' : 'Quote'} v{quote.version_number}</p>
          </div>
        </section>

        {doc === 'sow' && (
          <>
        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Problem Statement</h2>
          <p className="text-sm whitespace-pre-wrap">{problemStatement || 'Details to be finalized.'}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Proposed Approach</h2>
          <p className="text-sm">
            Red Loft engages this work through our Process &amp; Product framework, delivering a{' '}
            {approachLabel} engagement structured
            around clear phases, defined deliverables, and measurable outcomes.
          </p>
        </section>

        {categories.map((cat) => {
          const fields = SERVICE_DETAIL_FIELDS[cat] ?? [];
          const catDetails = (quote.service_details?.[cat] as Record<string, any>) || {};
          const visible = fields.filter((f) => {
            const v = catDetails[f.key];
            return Array.isArray(v) ? v.length > 0 : Boolean(v);
          });
          if (visible.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">
                {SERVICE_CATEGORY_LABELS[cat] ?? cat} — Project Context
              </h2>
              <dl className="text-sm space-y-1">
                {visible.map((f) => (
                  <div key={f.key} className="grid grid-cols-3 gap-2">
                    <dt className="text-slate-500">{f.label}</dt>
                    <dd className="col-span-2">
                      {Array.isArray(catDetails[f.key])
                        ? (catDetails[f.key] as string[])
                            .map((v) => f.options?.find((o) => o.value === v)?.label ?? v)
                            .join(', ')
                        : String(catDetails[f.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}

        {quote.timeline_urgency && (
          <section>
            <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Timeline</h2>
            <p className="text-sm">{quote.timeline_urgency}</p>
          </section>
        )}
          </>
        )}

        {doc === 'invoice' && (
        <section>
          <h2 className="text-sm font-semibold uppercase text-red-700 border-b pb-1 mb-2">Investment</h2>
          <table className="w-full text-sm">
            <tbody>
              {visiblePhases.map((p) => {
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
        )}

        <footer className="pt-6 text-xs text-slate-500 border-t">
          Prepared by Red Loft Consulting. {doc === 'invoice' ? 'Invoice' : 'Quote'} valid for 30 days from date issued.
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