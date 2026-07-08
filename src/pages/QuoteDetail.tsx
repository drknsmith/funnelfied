import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, Copy, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuote, useQuoteContractorItems, useQuotes, Quote } from '@/hooks/useQuotes';
import {
  PHASES,
  laborSubtotal,
  contractorSubtotal,
  contractorClientPrice,
  discountAmount,
  grandTotal,
  formatMoney,
  SERVICE_CATEGORY_LABELS,
  ENGAGEMENT_TYPES,
  CONTRACTOR_TYPE_LABELS,
  SERVICE_DETAIL_FIELDS,
} from '@/lib/quoteCalculations';

export default function QuoteDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: quote, isLoading } = useQuote(id);
  const { updateQuote, deleteQuote } = useQuotes();
  const { items, addItem, updateItem, deleteItem } = useQuoteContractorItems(id);

  const [local, setLocal] = useState<Quote | null>(null);
  useEffect(() => { if (quote) setLocal(quote); }, [quote]);

  if (isLoading || !local) {
    return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  }

  const save = (patch: Partial<Quote>) => {
    setLocal({ ...local, ...patch });
    updateQuote({ id: local.id, patch });
  };

  const saveDetail = (key: string, value: any) => {
    const details = { ...(local.service_details || {}), [key]: value };
    save({ service_details: details });
  };

  const labor = laborSubtotal(local);
  const disc = discountAmount(local);
  const contractors = contractorSubtotal(items);
  const total = grandTotal(local, items);
  const detailFields = local.service_category ? SERVICE_DETAIL_FIELDS[local.service_category] ?? [] : [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/quotes')}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">Quote v{local.version_number}</h1>
                {local.service_category && (
                  <Badge variant="secondary">
                    {SERVICE_CATEGORY_LABELS[local.service_category] ?? local.service_category}
                  </Badge>
                )}
              </div>
              <Link to={`/deals/${local.deal_id}`} className="text-xs text-primary hover:underline">
                View Opportunity →
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the sections below. Changes save automatically.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={local.status} onValueChange={(v) => save({ status: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['draft','sent','accepted','rejected'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => nav(`/quotes/new?dealId=${local.deal_id}&cloneFrom=${local.id}`)}
            >
              <Copy className="mr-2 h-4 w-4" /> New Version
            </Button>
            <Button onClick={() => nav(`/quotes/${local.id}/preview`)}>
              <Printer className="mr-2 h-4 w-4" /> Generate PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Client & Project</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Contact Name" value={local.snapshot_contact_name} />
            <Field label="Contact Email" value={local.snapshot_contact_email} />
            <Field label="Contact Phone" value={local.snapshot_contact_phone} />
            <Field label="Referral Source" value={local.snapshot_referral_source} />
            <Field label="Project Name" value={local.snapshot_project_name} />
            <Field label="Project Address" value={local.snapshot_project_address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Engagement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <Label>Engagement Type</Label>
              <Select value={local.engagement_type ?? ''} onValueChange={(v) => save({ engagement_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timeline / Urgency</Label>
              <Input value={local.timeline_urgency ?? ''} onChange={(e) => save({ timeline_urgency: e.target.value })} />
            </div>
            <div>
              <Label>Decision-Maker Count</Label>
              <Input
                type="number"
                value={local.decision_maker_count ?? ''}
                onChange={(e) => save({ decision_maker_count: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </CardContent>
        </Card>

        {detailFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {SERVICE_CATEGORY_LABELS[local.service_category!] ?? 'Service'} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailFields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  {f.type === 'textarea' ? (
                    <Textarea
                      value={local.service_details?.[f.key] ?? ''}
                      onChange={(e) => saveDetail(f.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={f.type}
                      value={local.service_details?.[f.key] ?? ''}
                      onChange={(e) => saveDetail(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Labor Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                value={local.hourly_rate}
                onChange={(e) => save({ hourly_rate: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="border rounded-lg divide-y">
              <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/40">
                <div className="col-span-6">Phase</div>
                <div className="col-span-2">Hours</div>
                <div className="col-span-2">Rate</div>
                <div className="col-span-2 text-right">Line Total</div>
              </div>
              {PHASES.map((p) => {
                const hours = Number(local[p.key]) || 0;
                const lineTotal = hours * (Number(local.hourly_rate) || 0);
                return (
                  <div key={p.key} className="grid grid-cols-12 gap-2 p-2 items-center text-sm">
                    <div className="col-span-6">
                      {p.label}
                      {p.key === 'phase_revisions_hours' && (
                        <div className="mt-1 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Rounds included</Label>
                          <Input
                            type="number"
                            className="h-7 w-16"
                            value={local.phase_revisions_rounds}
                            onChange={(e) => save({ phase_revisions_rounds: Number(e.target.value) || 0 })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={hours}
                        onChange={(e) => save({ [p.key]: Number(e.target.value) || 0 } as any)}
                      />
                    </div>
                    <div className="col-span-2 text-muted-foreground">{formatMoney(Number(local.hourly_rate) || 0)}</div>
                    <div className="col-span-2 text-right">{formatMoney(lineTotal)}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-12 gap-2 p-2 items-center text-sm bg-muted/30">
                <div className="col-span-10 text-right font-medium">Labor Subtotal</div>
                <div className="col-span-2 text-right font-semibold">{formatMoney(labor)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Contractors</CardTitle>
            <Button size="sm" variant="outline" onClick={() => addItem()}>
              <Plus className="mr-1 h-4 w-4" /> Add Contractor
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contractor line items.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-end border rounded p-2">
                    <div className="col-span-3">
                      <Label className="text-xs">Type</Label>
                      <Select value={it.contractor_type} onValueChange={(v) => updateItem({ id: it.id, patch: { contractor_type: v } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTRACTOR_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Vendor (internal)</Label>
                      <Input
                        defaultValue={it.vendor_name ?? ''}
                        onBlur={(e) => updateItem({ id: it.id, patch: { vendor_name: e.target.value } })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Flat Fee</Label>
                      <Input
                        type="number"
                        defaultValue={it.flat_fee}
                        onBlur={(e) => updateItem({ id: it.id, patch: { flat_fee: Number(e.target.value) || 0 } })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Markup %</Label>
                      <Input
                        type="number"
                        defaultValue={it.markup_percentage}
                        onBlur={(e) => updateItem({ id: it.id, patch: { markup_percentage: Number(e.target.value) || 0 } })}
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm">
                      {formatMoney(contractorClientPrice(it))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button size="icon" variant="ghost" onClick={() => deleteItem(it.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2 text-sm">
                  <span className="font-medium">Contractor Subtotal:&nbsp;</span>
                  {formatMoney(contractors)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Discount (applies to Labor only)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={local.discount_type ?? 'none'} onValueChange={(v) => save({ discount_type: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat $</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={local.discount_value}
                onChange={(e) => save({ discount_value: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label>Reason (internal)</Label>
              <Input
                value={local.discount_reason ?? ''}
                onChange={(e) => save({ discount_reason: e.target.value })}
              />
            </div>
            <div className="col-span-4 flex items-center gap-2">
              <Switch
                checked={local.include_discount_reason_on_pdf}
                onCheckedChange={(v) => save({ include_discount_reason_on_pdf: v })}
              />
              <Label>Show discount reason on client PDF</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Totals</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Labor Subtotal" value={formatMoney(labor)} />
            <Row label="Discount" value={`- ${formatMoney(disc)}`} />
            <Row label="Adjusted Labor" value={formatMoney(labor - disc)} />
            <Row label="Contractor Subtotal" value={formatMoney(contractors)} />
            <div className="border-t pt-2 mt-2">
              <Row label="Total" value={formatMoney(total)} bold />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => {
            if (confirm('Delete this quote?')) { deleteQuote(local.id); nav('/quotes'); }
          }}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Quote
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-base font-semibold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}