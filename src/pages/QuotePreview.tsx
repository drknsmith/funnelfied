import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useQuote, useQuoteContractorItems } from '@/hooks/useQuotes';
import logoAsset from '@/assets/red-loft-logo.png.asset.json';
import { useProposalReport, type SavedReport } from '@/hooks/useProposalReport';
import { formatCurrency, formatNumber } from '@/lib/superiorProposalAlgorithm';
import {
  PHASES,
  laborSubtotal,
  contractorClientPrice,
  discountAmount,
  grandTotal,
  formatMoney,
  CONTRACTOR_TYPE_LABELS,
} from '@/lib/quoteCalculations';

const TERMS_LABEL: Record<string, string> = { net15: 'Net 15', net30: 'Net 30', net45: 'Net 45' };
const CADENCE_LABEL: Record<string, string> = { monthly: 'monthly', biweekly: 'biweekly' };

function splitTermsAtAcceptance(text: string): { before: string; after: string } | null {
  if (!text) return null;
  const acceptanceRe = /^\s*(?:(?:###?|Section)\s*)?3[.:\)]?\s*[-–—.]?\s*Acceptance\s*$/i;
  const sectionRe = /^\s*(?:(?:###?|Section)\s*)?\d+[.:\)]\s*[-–—.]?\s*[A-Z].{0,80}$/i;
  const lines = text.split('\n');
  let acceptanceIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (acceptanceRe.test(lines[i])) {
      acceptanceIndex = i;
      break;
    }
  }
  if (acceptanceIndex === -1) return null;
  let splitIndex = lines.length;
  for (let i = acceptanceIndex + 1; i < lines.length; i++) {
    if (sectionRe.test(lines[i])) {
      splitIndex = i;
      break;
    }
  }
  return { before: lines.slice(0, splitIndex).join('\n'), after: lines.slice(splitIndex).join('\n') };
}

export default function QuotePreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const doc = params.get('doc') === 'invoice' ? 'invoice' : 'sow';
  const { data: quote } = useQuote(id);
  const { items } = useQuoteContractorItems(id);
  const { loadReportByDealId } = useProposalReport();
  const [research, setResearch] = useState<SavedReport | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [playbookTerms, setPlaybookTerms] = useState<string>('');
  const includeResearch = !!(quote as any)?.sow_include_research;
  const dealId = (quote as any)?.deal_id as string | undefined;
  const workspaceId = (quote as any)?.workspace_id as string | undefined;

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await (supabase as any)
          .from('playbooks')
          .select('terms_and_conditions')
          .eq('workspace_id', workspaceId)
          .eq('kind', 'service_knowledge')
          .maybeSingle();
        if (data?.terms_and_conditions) setPlaybookTerms(data.terms_and_conditions);
      } catch { /* ignore */ }
    })();
  }, [workspaceId]);

  useEffect(() => {
    if (!includeResearch || !dealId) { setResearch(null); return; }
    (async () => {
      const r = await loadReportByDealId(dealId);
      setResearch(r);
    })();
  }, [includeResearch, dealId]);

  useEffect(() => {
    if (!includeResearch) return;
    (async () => {
      try {
        const { data } = await (await import('@/integrations/supabase/client')).supabase.functions.invoke('get-mapbox-token');
        if ((data as any)?.token) setMapboxToken((data as any).token);
      } catch { /* ignore */ }
    })();
  }, [includeResearch]);

  useEffect(() => {
    document.body.classList.add('quote-print-mode');
    return () => document.body.classList.remove('quote-print-mode');
  }, []);

  useEffect(() => {
    // Load Roboto for the SOW print layout
    const id = 'roboto-sow-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
      document.head.appendChild(link);
    }
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

  const sowRef = `SOW-${(quote.id || '').slice(0, 6).toUpperCase()}-v${quote.version_number}`;
  const deliverables = Array.isArray(quote.sow_deliverables) ? quote.sow_deliverables : [];
  const workItems: Array<{ name: string; description: string }> = Array.isArray((quote as any).sow_work_items) ? (quote as any).sow_work_items : [];
  const milestones = Array.isArray(quote.sow_milestones) ? quote.sow_milestones : [];
  const pillars: string[] = Array.isArray(quote.sow_approach_pillars) ? quote.sow_approach_pillars : [];
  const termsAndConditions: string =
    ((quote as any).sow_terms_and_conditions && String((quote as any).sow_terms_and_conditions).trim())
      ? (quote as any).sow_terms_and_conditions
      : playbookTerms;

  const sigProviderCompany = (quote as any).sow_signature_provider_company || 'Red Loft Consulting';
  const sigProviderName = (quote as any).sow_signature_provider_name || quote.redloft_contact_name || '';
  const sigProviderTitle = (quote as any).sow_signature_provider_title || quote.redloft_contact_title || '';
  const sigClientCompany = (quote as any).sow_signature_client_company || (quote as any).snapshot_account_name || quote.snapshot_project_name || '';
  const sigClientName = (quote as any).sow_signature_client_name || quote.snapshot_contact_name || '';
  const sigClientTitle = (quote as any).sow_signature_client_title || '';

  const termsSplit = useMemo(() => splitTermsAtAcceptance(termsAndConditions), [termsAndConditions]);
  const termsBeforeSignatures = termsSplit?.before ?? termsAndConditions;
  const termsAfterSignatures = termsSplit?.after ?? '';

  const billingSentence = useMemo(() => {
    if (doc !== 'sow') return '';
    const parts: string[] = [];
    if (rate > 0) parts.push(`Services are billed at ${formatMoney(rate)} per hour.`);
    const mn = quote.sow_estimated_hours_min;
    const mx = quote.sow_estimated_hours_max;
    if (mn && mx) parts.push(`Planning estimate: ${mn}–${mx} hours (non-binding, not a cap).`);
    else if (mn) parts.push(`Planning estimate: at least ${mn} hours (non-binding, not a cap).`);
    else if (mx) parts.push(`Planning estimate: up to ${mx} hours (non-binding, not a cap).`);
    if (quote.sow_nte_enabled && quote.sow_nte_amount && Number(quote.sow_nte_amount) > 0) {
      parts.push(`Client-requested total hours cap: ${Number(quote.sow_nte_amount)} hours.`);
    }
    const cadence = CADENCE_LABEL[quote.sow_invoicing_cadence ?? ''];
    const terms = TERMS_LABEL[quote.sow_invoice_terms ?? ''];
    if (cadence && terms) parts.push(`Invoices are issued ${cadence} on ${terms} terms.`);
    else if (cadence) parts.push(`Invoices are issued ${cadence}.`);
    else if (terms) parts.push(`Invoice terms: ${terms}.`);
    const thr = Number(quote.sow_expense_threshold ?? 250);
    if (thr > 0) parts.push(`Expenses over ${formatMoney(thr)} require prior written approval.`);
    return parts.join(' ');
  }, [doc, rate, quote]);

  const staticMapUrl = (() => {
    if (!research?.mapCenter || !mapboxToken) return null;
    const { lat, lng } = research.mapCenter;
    const markers: string[] = [`pin-l-star+fbbf24(${lng},${lat})`];
    (research.multifamilyComps || []).slice(0, 20).forEach((c: any) => {
      if (c.lat && c.lng) markers.push(`pin-s+ef4444(${c.lng},${c.lat})`);
    });
    (research.fitnessComps || []).slice(0, 20).forEach((c: any) => {
      if (c.lat && c.lng) markers.push(`pin-s+3b82f6(${c.lng},${c.lat})`);
    });
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers.join(',')}/auto/800x400@2x?access_token=${mapboxToken}`;
  })();

  const copyMarkdown = async () => {
    const lines: string[] = [];
    lines.push(`# Statement of Work`);
    lines.push(`Reference: ${sowRef}`);
    lines.push('');
    if (quote.snapshot_project_name) lines.push(`Project: ${quote.snapshot_project_name}`);
    if (quote.snapshot_contact_name) lines.push(`Client Contact: ${quote.snapshot_contact_name}`);
    lines.push('');
    if (quote.sow_executive_summary) lines.push(`## Executive Summary\n\n${quote.sow_executive_summary}\n`);
    if (quote.sow_problem_statement) lines.push(`## Problem Statement\n\n${quote.sow_problem_statement}\n`);
    if (quote.sow_proposed_approach) {
      lines.push(`## Proposed Approach\n\n${quote.sow_proposed_approach}`);
      if (pillars.length) lines.push(`\n_4 P's pillars: ${pillars.map((p) => p[0].toUpperCase() + p.slice(1)).join(', ')}_\n`);
      else lines.push('');
    }
    if (workItems.length) {
      lines.push(`## Scope of Services\n`);
      workItems.forEach((w) => lines.push(`- **${w.name || 'Item'}** — ${w.description || ''}`));
      lines.push('');
    }
    if (deliverables.length) {
      lines.push(`## Deliverables\n`);
      deliverables.forEach((d) => lines.push(`- **${d.name || 'Deliverable'}** — ${d.description || ''}`));
      lines.push('');
    }
    if (milestones.length) {
      lines.push(`## Timeline & Milestones\n`);
      lines.push(`| Milestone | Description | Target Date |`);
      lines.push(`|---|---|---|`);
      milestones.forEach((m) => lines.push(`| ${m.name || ''} | ${m.description || ''} | ${m.target_date || ''} |`));
      lines.push('');
    }
    if (billingSentence) lines.push(`## Rate & Billing Terms\n\n${billingSentence}\n`);
    if (termsAndConditions) {
      if (termsSplit) {
        lines.push(`## Terms and Conditions\n\n${termsSplit.before}\n`);
      } else {
        lines.push(`## Terms and Conditions\n\n${termsAndConditions}\n`);
      }
    }
    if (doc === 'sow') {
      lines.push(`## Signatures\n`);
      lines.push(`**${sigProviderCompany}**  `);
      lines.push(`By: ${sigProviderName}${sigProviderTitle ? `, ${sigProviderTitle}` : ''}  `);
      lines.push(`Signature: ______________________  Date: __________\n`);
      lines.push(`**${sigClientCompany}**  `);
      lines.push(`By: ${sigClientName}${sigClientTitle ? `, ${sigClientTitle}` : ''}  `);
      lines.push(`Signature: ______________________  Date: __________\n`);
    }
    if (termsAndConditions && termsSplit?.after) {
      lines.push(`## Terms and Conditions (continued)\n\n${termsSplit.after}\n`);
    }
    if (includeResearch && research) {
      const b = research.outputs?.section1_budget;
      const s = research.outputs?.section2_squareFootage;
      const e = research.outputs?.section3_equipmentFocus;
      lines.push(`## Appendix: Location Research\n`);
      if (research.communityAddress) lines.push(`Address: ${research.communityAddress}\n`);
      if (b?.ok) lines.push(`- **Recommended Fitness Equipment Budget:** ${formatCurrency(b.budget || 0)} (${formatCurrency(b.costPerSF || 0)} / SF, Class ${b.propertyClass})`);
      if (s?.ok) lines.push(`- **Recommended Fitness Center Square Footage:** ${formatNumber(s.squareFootage || 0)} sq ft`);
      if (e?.topPriorities?.length) lines.push(`- **Equipment Focus:** ${e.topPriorities.map((p: any) => p.type).join(', ')}`);
      if (e?.activityLevel) lines.push(`- **Activity Profile:** ${e.activityLevel}`);
      if (research.multifamilyComps?.length) {
        lines.push(`\n**Multifamily Comps (${research.multifamilyComps.length})**`);
        research.multifamilyComps.slice(0, 8).forEach((c: any) => lines.push(`- ${c.name} — ${c.distance?.toFixed(1)} mi (${c.address})`));
      }
      if (research.fitnessComps?.length) {
        lines.push(`\n**Fitness Comps (${research.fitnessComps.length})**`);
        research.fitnessComps.slice(0, 8).forEach((c: any) => lines.push(`- ${c.name} — ${c.distance?.toFixed(1)} mi (${c.address})`));
      }
      lines.push('');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Copied as Markdown' });
    } catch (e: any) {
      toast({ title: 'Copy failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-3 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => nav(`/quotes/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Editor
        </Button>
        <div className="flex gap-2">
          {doc === 'sow' && (
            <Button variant="outline" onClick={copyMarkdown}>
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy as Markdown
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Export as PDF
          </Button>
        </div>
      </div>

      <div className={doc === 'sow' ? 'sow-print max-w-[8.5in] mx-auto my-6 shadow print:shadow-none p-10 space-y-6' : 'max-w-[8.5in] mx-auto my-6 bg-white text-slate-900 shadow print:shadow-none p-10 space-y-6'}>
        <header className="border-b pb-4">
          <img src={logoAsset.url} alt="Red Loft Consulting" className="h-28 w-auto" />
          <p className={doc === 'sow' ? 'sow-meta mt-2' : 'text-xs text-slate-600 mt-2'}>
            {doc === 'invoice' ? 'Invoice' : 'Statement of Work'}
            {doc === 'sow' ? ` · Reference ${sowRef}` : ' · Programming · Design · Policy'}
          </p>
        </header>

        <section className={doc === 'sow' ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-3 gap-4 text-sm'}>
          <div>
            <p className={doc === 'sow' ? 'sow-eyebrow' : 'text-xs uppercase text-slate-500'}>Red Loft Contact</p>
            <p className={doc === 'sow' ? 'sow-strong' : 'font-medium'}>{quote.redloft_contact_name || '—'}</p>
            {quote.redloft_contact_title && <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.redloft_contact_title}</p>}
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.redloft_contact_email}</p>
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.redloft_contact_phone}</p>
          </div>
          <div>
            <p className={doc === 'sow' ? 'sow-eyebrow' : 'text-xs uppercase text-slate-500'}>Prepared For</p>
            <p className={doc === 'sow' ? 'sow-strong' : 'font-medium'}>{quote.snapshot_contact_name || '—'}</p>
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.snapshot_contact_email}</p>
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.snapshot_contact_phone}</p>
          </div>
          <div className={doc === 'sow' ? 'text-right' : 'text-right'}>
            <p className={doc === 'sow' ? 'sow-eyebrow' : 'text-xs uppercase text-slate-500'}>Project</p>
            <p className={doc === 'sow' ? 'sow-strong' : 'font-medium'}>{quote.snapshot_project_name || '—'}</p>
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{quote.snapshot_project_address}</p>
            <p className={doc === 'sow' ? 'sow-muted mt-1' : 'text-slate-600 mt-1'}>Date: {new Date(quote.created_at).toLocaleDateString()}</p>
            <p className={doc === 'sow' ? 'sow-muted' : 'text-slate-600'}>{doc === 'invoice' ? 'Invoice' : 'SOW'} v{quote.version_number}</p>
          </div>
        </section>

        {doc === 'sow' && (
          <>
        {quote.sow_executive_summary && (
          <section>
            <h2 className="sow-h2">Executive Summary</h2>
            <p className="sow-body whitespace-pre-wrap">{quote.sow_executive_summary}</p>
          </section>
        )}

        {quote.sow_problem_statement && (
          <section>
            <h2 className="sow-h2">Problem Statement</h2>
            <p className="sow-body whitespace-pre-wrap">{quote.sow_problem_statement}</p>
          </section>
        )}

        {quote.sow_proposed_approach && (
          <section>
            <h2 className="sow-h2">Proposed Approach</h2>
            <p className="sow-body whitespace-pre-wrap">{quote.sow_proposed_approach}</p>
            {pillars.length > 0 && (
              <p className="sow-muted mt-2">
                4 P's pillars applied: {pillars.map((p) => p[0].toUpperCase() + p.slice(1)).join(' · ')}
              </p>
            )}
          </section>
        )}

        {workItems.length > 0 && (
          <section>
            <h2 className="sow-h2">Scope of Services</h2>
            <ul className="sow-body list-disc pl-5 space-y-1">
              {workItems.map((w, i) => (
                <li key={i}><span className="sow-strong">{w.name || 'Item'}</span>{w.description ? ` — ${w.description}` : ''}</li>
              ))}
            </ul>
          </section>
        )}

        {deliverables.length > 0 && (
          <section>
            <h2 className="sow-h2">Deliverables</h2>
            <ul className="sow-body list-disc pl-5 space-y-1">
              {deliverables.map((d, i) => (
                <li key={i}><span className="sow-strong">{d.name || 'Deliverable'}</span>{d.description ? ` — ${d.description}` : ''}</li>
              ))}
            </ul>
          </section>
        )}

        {milestones.length > 0 && (
          <section>
            <h2 className="sow-h2">Timeline &amp; Milestones</h2>
            <table className="sow-table w-full">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Description</th>
                  <th>Target Date</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, i) => (
                  <tr key={i}>
                    <td>{m.name}</td>
                    <td>{m.description}</td>
                    <td>{m.target_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {billingSentence && (
          <section>
            <h2 className="sow-h2">Rate &amp; Billing Terms</h2>
            <p className="sow-body">{billingSentence}</p>
          </section>
        )}

        {termsBeforeSignatures && (
          <section>
            <h2 className="sow-h2">Terms and Conditions</h2>
            <p className="sow-body whitespace-pre-wrap">{termsBeforeSignatures}</p>
          </section>
        )}

        <section>
          <h2 className="sow-h2">Signatures</h2>
          <div className="grid grid-cols-2 gap-8 sow-body">
            <div>
              <p className="sow-strong">{sigProviderCompany}</p>
              <div className="mt-8 border-t border-black pt-1">
                <p className="sow-strong">{sigProviderName}</p>
                {sigProviderTitle && <p className="sow-muted">{sigProviderTitle}</p>}
                <p className="sow-muted mt-2">Date: ______________________</p>
              </div>
            </div>
            <div>
              <p className="sow-strong">{sigClientCompany}</p>
              <div className="mt-8 border-t border-black pt-1">
                <p className="sow-strong">{sigClientName}</p>
                {sigClientTitle && <p className="sow-muted">{sigClientTitle}</p>}
                <p className="sow-muted mt-2">Date: ______________________</p>
              </div>
            </div>
          </div>
        </section>

        {termsAfterSignatures && (
          <section>
            <h2 className="sow-h2">Terms and Conditions (continued)</h2>
            <p className="sow-body whitespace-pre-wrap">{termsAfterSignatures}</p>
          </section>
        )}

        {includeResearch && research && (
          <section style={{ pageBreakBefore: 'always' }}>
            <h2 className="sow-h2">Appendix: Location Research</h2>
            {research.communityAddress && (
              <p className="sow-muted mb-2">{research.communityAddress}</p>
            )}
            {staticMapUrl && (
              <div className="mb-4">
                <div className="flex gap-4 text-xs sow-muted mb-2">
                  <span>★ Subject Property</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, marginRight: 4 }} />Multifamily</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#3b82f6', borderRadius: 999, marginRight: 4 }} />Fitness</span>
                </div>
                <img src={staticMapUrl} alt="Market map" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 6 }} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sow-body">
              {research.outputs?.section1_budget?.ok && (
                <div>
                  <p className="sow-eyebrow">Recommended Fitness Equipment Budget</p>
                  <p className="sow-strong">{formatCurrency(research.outputs.section1_budget.budget || 0)}</p>
                  <p className="sow-muted">{formatCurrency(research.outputs.section1_budget.costPerSF || 0)} / SF · Class {research.outputs.section1_budget.propertyClass}</p>
                </div>
              )}
              {research.outputs?.section2_squareFootage?.ok && (
                <div>
                  <p className="sow-eyebrow">Recommended Fitness Center Square Footage</p>
                  <p className="sow-strong">{formatNumber(research.outputs.section2_squareFootage.squareFootage || 0)} sq ft</p>
                </div>
              )}
            </div>
            {research.outputs?.section3_equipmentFocus && (
              <div className="mt-3 sow-body">
                <p className="sow-eyebrow">Equipment Focus</p>
                <p>{research.outputs.section3_equipmentFocus.topPriorities?.map((p: any) => p.type).join(' · ')}</p>
                {research.outputs.section3_equipmentFocus.activityLevel && (
                  <p className="sow-muted">Activity Profile: {research.outputs.section3_equipmentFocus.activityLevel}</p>
                )}
              </div>
            )}
            {research.multifamilyComps?.length > 0 && (
              <div className="mt-4 sow-body">
                <p className="sow-eyebrow">Multifamily Comps ({research.multifamilyComps.length})</p>
                <ul className="list-disc pl-5">
                  {research.multifamilyComps.slice(0, 8).map((c: any, i: number) => (
                    <li key={i}><span className="sow-strong">{c.name}</span> — {c.distance?.toFixed(1)} mi <span className="sow-muted">({c.address})</span></li>
                  ))}
                </ul>
              </div>
            )}
            {research.fitnessComps?.length > 0 && (
              <div className="mt-4 sow-body">
                <p className="sow-eyebrow">Fitness Comps ({research.fitnessComps.length})</p>
                <ul className="list-disc pl-5">
                  {research.fitnessComps.slice(0, 8).map((c: any, i: number) => (
                    <li key={i}><span className="sow-strong">{c.name}</span> — {c.distance?.toFixed(1)} mi <span className="sow-muted">({c.address})</span></li>
                  ))}
                </ul>
              </div>
            )}
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

        <footer className={doc === 'sow' ? 'sow-footer pt-6 border-t' : 'pt-6 text-xs text-slate-500 border-t'}>
          Prepared by Red Loft Consulting. {doc === 'invoice' ? 'Invoice valid for 30 days from date issued.' : 'Terms of Engagement provided separately.'}
        </footer>
      </div>

      <style>{`
        @media print {
          body.quote-print-mode { background: white !important; }
          body.quote-print-mode nav, body.quote-print-mode aside { display: none !important; }
          @page { size: letter; margin: 0.75in; }
        }
        .sow-print {
          background: #ffffff;
          color: #000000;
          font-family: 'Roboto', system-ui, sans-serif;
          font-weight: 400;
        }
        .sow-print h2.sow-h2 {
          font-family: 'Roboto', system-ui, sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          color: #000000;
          font-size: 12px;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #FF3131;
          padding-bottom: 4px;
          margin-bottom: 10px;
        }
        .sow-print .sow-body { font-size: 13px; line-height: 1.55; color: #000000; }
        .sow-print .sow-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #A6A6A6; font-weight: 500; }
        .sow-print .sow-muted { color: #A6A6A6; font-size: 12px; }
        .sow-print .sow-strong { font-weight: 700; color: #000000; }
        .sow-print .sow-footer { color: #A6A6A6; font-size: 11px; border-top-color: #A6A6A6; }
        .sow-print header { border-bottom-color: #A6A6A6 !important; }
        .sow-print .sow-table { border-collapse: collapse; font-size: 12px; }
        .sow-print .sow-table th, .sow-print .sow-table td { border: 1px solid #A6A6A6; padding: 6px 8px; text-align: left; vertical-align: top; color: #000000; }
        .sow-print .sow-table thead th { background: #ffffff; text-transform: uppercase; font-weight: 700; font-size: 11px; letter-spacing: 0.05em; }
        @media print { .sow-print .sow-table { page-break-inside: avoid; } }
      `}</style>
    </div>
  );
}