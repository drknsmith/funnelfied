import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Printer, Copy, Trash2, Loader2, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuote, useQuoteContractorItems, useQuotes, Quote } from '@/hooks/useQuotes';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProposalReport } from '@/hooks/useProposalReport';
import { isRedLoftWorkspace } from '@/lib/workspaceFeatures';
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
  const { workspaceId } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [processingMilestones, setProcessingMilestones] = useState(false);
  const [milestonesDirty, setMilestonesDirty] = useState(false);
  const [localMilestones, setLocalMilestones] = useState<Array<{ name: string; description: string; target_date: string }> | null>(null);
  const [processingWork, setProcessingWork] = useState(false);
  const [workDirty, setWorkDirty] = useState(false);
  const [localWork, setLocalWork] = useState<Array<{ name: string; description: string }> | null>(null);
  const [processingDeliverables, setProcessingDeliverables] = useState(false);
  const [processingHours, setProcessingHours] = useState(false);
  const [deliverablesDirty, setDeliverablesDirty] = useState(false);
  const [localDeliverables, setLocalDeliverables] = useState<Array<{ name: string; description: string }> | null>(null);
  const qc = useQueryClient();

  const [local, setLocal] = useState<Quote | null>(null);
  useEffect(() => { if (quote) setLocal(quote); }, [quote]);
  const accountId = (quote as any)?.deals?.account_id as string | undefined;
  const { contacts: accountContacts } = useContacts(accountId);
  const { loadReportByDealId } = useProposalReport();
  const [dealResearch, setDealResearch] = useState<{ community_name: string; created_at: string } | null>(null);
  const isRedLoft = isRedLoftWorkspace(workspaceId);

  useEffect(() => {
    const dealId = (quote as any)?.deal_id;
    if (!isRedLoft || !dealId) { setDealResearch(null); return; }
    (async () => {
      const r = await loadReportByDealId(dealId);
      if (r) setDealResearch({ community_name: r.communityName, created_at: r.createdAt });
      else setDealResearch(null);
    })();
  }, [(quote as any)?.deal_id, isRedLoft]);

  if (isLoading || !local) {
    return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  }

  const save = (patch: Partial<Quote>) => {
    setLocal({ ...local, ...patch });
    updateQuote({ id: local.id, patch });
  };

  const saveDetail = (category: string, key: string, value: any) => {
    const all = { ...(local.service_details || {}) };
    const catObj = { ...(all[category] || {}), [key]: value };
    all[category] = catObj;
    save({ service_details: all });
  };

  const labor = laborSubtotal(local);
  const disc = discountAmount(local);
  const contractors = contractorSubtotal(items);
  const total = grandTotal(local, items);
  const categories = local.service_category ?? [];
  const visiblePhases = PHASES.filter(
    (p) => !('requiresCategory' in p) || categories.includes((p as any).requiresCategory),
  );
  const CONTRACTOR_SPLIT_LABELS: Record<string, { design: string; shipping: string } | null> = {
    fitness_equipment: { design: 'Design & Equipment', shipping: 'Shipping & Delivery' },
    interior_design: { design: 'Design & Products', shipping: 'Shipping & Delivery' },
  };

  const sowReference = `SOW-${(local.id || '').slice(0, 6).toUpperCase()}-v${local.version_number}`;
  const deliverables: Array<{ name: string; description: string }> = Array.isArray((local as any).sow_deliverables)
    ? (local as any).sow_deliverables
    : [];
  const workItems: Array<{ name: string; description: string }> = Array.isArray((local as any).sow_work_items)
    ? (local as any).sow_work_items
    : [];
  const effectiveWork = localWork ?? workItems;
  const effectiveDeliverables = localDeliverables ?? deliverables;
  const milestones: Array<{ name: string; description: string; target_date: string }> = Array.isArray((local as any).sow_milestones)
    ? (local as any).sow_milestones
    : [];
  const effectiveMilestones = localMilestones ?? milestones;
  const pillars: string[] = Array.isArray((local as any).sow_approach_pillars) ? (local as any).sow_approach_pillars : [];
  const PILLARS = ['Policy', 'People', 'Process', 'Product'];

  async function generateSow() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sow', {
        body: { quoteId: local!.id, workspaceId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const warnings: string[] = Array.isArray((data as any)?.warnings) ? (data as any).warnings : [];
      warnings.forEach((w) =>
        toast({ title: 'Heads up', description: w }),
      );
      toast({ title: 'SOW generated' });
      await qc.invalidateQueries({ queryKey: ['quote', local!.id] });
      nav(`/quotes/${local!.id}/preview?doc=sow`);
    } catch (e: any) {
      toast({ title: 'SOW generation failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  async function processMilestones() {
    setProcessingMilestones(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-milestones', {
        body: { quoteId: local!.id, workspaceId, currentMilestones: effectiveMilestones },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const next = Array.isArray((data as any)?.milestones) ? (data as any).milestones : [];
      setLocalMilestones(next);
      setMilestonesDirty(true);
      const warnings: string[] = Array.isArray((data as any)?.warnings) ? (data as any).warnings : [];
      warnings.forEach((w) => toast({ title: 'Heads up', description: w }));
      toast({ title: 'AI suggestions applied — review and Save' });
    } catch (e: any) {
      toast({ title: 'Milestone processing failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setProcessingMilestones(false);
    }
  }

  function updateMilestone(i: number, patch: Partial<{ name: string; description: string; target_date: string }>) {
    const next = [...effectiveMilestones];
    next[i] = { ...next[i], ...patch };
    setLocalMilestones(next);
    setMilestonesDirty(true);
  }

  function removeMilestone(i: number) {
    const next = effectiveMilestones.filter((_, j) => j !== i);
    setLocalMilestones(next);
    setMilestonesDirty(true);
  }

  function addMilestone() {
    const next = [...effectiveMilestones, { name: '', description: '', target_date: '' }];
    setLocalMilestones(next);
    setMilestonesDirty(true);
  }

  function saveMilestones() {
    save({ sow_milestones: effectiveMilestones } as any);
    setMilestonesDirty(false);
    setLocalMilestones(null);
    toast({ title: 'Milestones saved' });
  }

  async function processWork() {
    setProcessingWork(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-work', {
        body: { quoteId: local!.id, workspaceId, currentItems: effectiveWork },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const next = Array.isArray((data as any)?.items) ? (data as any).items : [];
      setLocalWork(next);
      setWorkDirty(true);
      const warnings: string[] = Array.isArray((data as any)?.warnings) ? (data as any).warnings : [];
      warnings.forEach((w) => toast({ title: 'Heads up', description: w }));
      toast({ title: 'AI suggestions applied — review and Save' });
    } catch (e: any) {
      toast({ title: 'Work processing failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setProcessingWork(false);
    }
  }

  function updateWork(i: number, patch: Partial<{ name: string; description: string }>) {
    const next = [...effectiveWork];
    next[i] = { ...next[i], ...patch };
    setLocalWork(next);
    setWorkDirty(true);
  }
  function removeWork(i: number) {
    setLocalWork(effectiveWork.filter((_, j) => j !== i));
    setWorkDirty(true);
  }
  function addWork() {
    setLocalWork([...effectiveWork, { name: '', description: '' }]);
    setWorkDirty(true);
  }
  function saveWork() {
    save({ sow_work_items: effectiveWork } as any);
    setWorkDirty(false);
    setLocalWork(null);
    toast({ title: 'Work items saved' });
  }

  async function processDeliverables() {
    setProcessingDeliverables(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-deliverables', {
        body: { quoteId: local!.id, workspaceId, currentItems: effectiveDeliverables },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const next = Array.isArray((data as any)?.items) ? (data as any).items : [];
      setLocalDeliverables(next);
      setDeliverablesDirty(true);
      const warnings: string[] = Array.isArray((data as any)?.warnings) ? (data as any).warnings : [];
      warnings.forEach((w) => toast({ title: 'Heads up', description: w }));
      toast({ title: 'AI suggestions applied — review and Save' });
    } catch (e: any) {
      toast({ title: 'Deliverables processing failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setProcessingDeliverables(false);
    }
  }

  async function processHours() {
    setProcessingHours(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-hours', {
        body: { quoteId: local!.id, workspaceId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const min = Number((data as any)?.min);
      const max = Number((data as any)?.max);
      if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error('Invalid AI response');
      save({ sow_estimated_hours_min: min, sow_estimated_hours_max: max } as any);
      const warnings: string[] = Array.isArray((data as any)?.warnings) ? (data as any).warnings : [];
      warnings.forEach((w) => toast({ title: 'Heads up', description: w }));
      const rationale = typeof (data as any)?.rationale === 'string' ? (data as any).rationale : '';
      toast({ title: `AI estimated ${min}–${max} hrs`, description: rationale || undefined });
    } catch (e: any) {
      toast({ title: 'Hours estimation failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setProcessingHours(false);
    }
  }

  function updateDeliverable(i: number, patch: Partial<{ name: string; description: string }>) {
    const next = [...effectiveDeliverables];
    next[i] = { ...next[i], ...patch };
    setLocalDeliverables(next);
    setDeliverablesDirty(true);
  }
  function removeDeliverable(i: number) {
    setLocalDeliverables(effectiveDeliverables.filter((_, j) => j !== i));
    setDeliverablesDirty(true);
  }
  function addDeliverable() {
    setLocalDeliverables([...effectiveDeliverables, { name: '', description: '' }]);
    setDeliverablesDirty(true);
  }
  function saveDeliverables() {
    save({ sow_deliverables: effectiveDeliverables } as any);
    setDeliverablesDirty(false);
    setLocalDeliverables(null);
    toast({ title: 'Deliverables saved' });
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/quotes')}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">Quote v{local.version_number}</h1>
                {categories.map((c) => (
                  <Badge key={c} variant="secondary">
                    {SERVICE_CATEGORY_LABELS[c] ?? c}
                  </Badge>
                ))}
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
          </div>
        </div>

        <Tabs defaultValue="sow" className="w-full">
          <TabsList>
            <TabsTrigger value="sow">SOW</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>

          <TabsContent value="sow" className="space-y-6 mt-4">
            <div className="flex justify-end">
              <Button onClick={generateSow} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Generate SOW PDF
              </Button>
            </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Red Loft Contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Red Loft Contact Name</Label>
              <Input
                value={local.redloft_contact_name ?? ''}
                onChange={(e) => save({ redloft_contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={local.redloft_contact_title ?? ''}
                onChange={(e) => save({ redloft_contact_title: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={local.redloft_contact_email ?? ''}
                onChange={(e) => save({ redloft_contact_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={local.redloft_contact_phone ?? ''}
                onChange={(e) => save({ redloft_contact_phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Client & Project</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Contact</Label>
              <Select
                value={local.contact_id ?? ''}
                onValueChange={(v) => {
                  const c = accountContacts.find((x) => x.id === v);
                  save({
                    contact_id: v,
                    snapshot_contact_name: c?.name ?? null,
                    snapshot_contact_email: c?.email ?? null,
                    snapshot_contact_phone: c?.phone ?? null,
                  } as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={accountContacts.length ? 'Select a contact' : 'No contacts on this account'} />
                </SelectTrigger>
                <SelectContent>
                  {accountContacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.email ? ` — ${c.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={local.snapshot_contact_email ?? ''}
                onChange={(e) => save({ snapshot_contact_email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={local.snapshot_contact_phone ?? ''}
                onChange={(e) => save({ snapshot_contact_phone: e.target.value })}
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <Label>Project Name</Label>
              <Input
                value={local.snapshot_project_name ?? ''}
                onChange={(e) => save({ snapshot_project_name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Project Address</Label>
              <Input
                value={local.snapshot_project_address ?? ''}
                onChange={(e) => save({ snapshot_project_address: e.target.value })}
              />
            </div>
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

        {categories.map((cat) => {
          const fields = SERVICE_DETAIL_FIELDS[cat] ?? [];
          if (fields.length === 0) return null;
          const catDetails = (local.service_details?.[cat] as Record<string, any>) || {};
          return (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {SERVICE_CATEGORY_LABELS[cat] ?? cat} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((f) => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea
                        value={catDetails[f.key] ?? ''}
                        onChange={(e) => saveDetail(cat, f.key, e.target.value)}
                      />
                    ) : f.type === 'select' ? (
                      <Select
                        value={catDetails[f.key] ?? ''}
                        onValueChange={(v) => saveDetail(cat, f.key, v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {f.options?.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : f.type === 'multiselect' ? (
                      <div className="flex flex-col gap-2 mt-1">
                        {f.options?.map((o) => {
                          const current: string[] = Array.isArray(catDetails[f.key]) ? catDetails[f.key] : [];
                          const checked = current.includes(o.value);
                          return (
                            <label key={o.value} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const next = v
                                    ? [...current, o.value]
                                    : current.filter((x) => x !== o.value);
                                  saveDetail(cat, f.key, next);
                                }}
                              />
                              {o.label}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        type={f.type}
                        value={catDetails[f.key] ?? ''}
                        onChange={(e) => saveDetail(cat, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* ===== Statement of Work authoring ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Statement of Work</span>
              <span className="text-xs font-mono text-muted-foreground">Ref: {sowReference}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Executive Summary</Label>
              <Textarea
                rows={4}
                value={local.sow_executive_summary ?? ''}
                onChange={(e) => save({ sow_executive_summary: e.target.value } as any)}
                placeholder="Optional notes — the AI will expand and polish this when you Generate SOW PDF."
              />
            </div>

            <div className="space-y-2">
              <Label>Problem Statement</Label>
              <Textarea
                rows={4}
                value={local.sow_problem_statement ?? ''}
                onChange={(e) => save({ sow_problem_statement: e.target.value } as any)}
                placeholder="Optional notes — the AI will expand and polish this when you Generate SOW PDF."
              />
            </div>

            <div className="space-y-2">
              <Label>Proposed Approach</Label>
              <Textarea
                rows={5}
                value={local.sow_proposed_approach ?? ''}
                onChange={(e) => save({ sow_proposed_approach: e.target.value } as any)}
                placeholder="Optional notes — the AI will expand this and apply the 4 P's tags below when you Generate SOW PDF."
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground">4 P's pillars:</span>
                {PILLARS.map((p) => {
                  const key = p.toLowerCase();
                  const on = pillars.includes(key);
                  return (
                    <label key={p} className="flex items-center gap-1 text-xs">
                      <Checkbox
                        checked={on}
                        onCheckedChange={(v) => {
                          const next = v ? [...pillars, key] : pillars.filter((x) => x !== key);
                          save({ sow_approach_pillars: next } as any);
                        }}
                      />
                      {p}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Work */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Work</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={processWork} disabled={processingWork}>
                    {processingWork ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Process Work with AI
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addWork}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                  {workDirty && (
                    <Button type="button" size="sm" onClick={saveWork}>Save</Button>
                  )}
                </div>
              </div>
              {workDirty && (
                <p className="text-xs text-primary">AI suggestions applied — review and Save.</p>
              )}
              {effectiveWork.length === 0 && <p className="text-xs text-muted-foreground">No work items yet.</p>}
              {effectiveWork.map((w, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <Input
                    className="col-span-4"
                    placeholder="Name"
                    value={w.name}
                    onChange={(e) => updateWork(i, { name: e.target.value })}
                  />
                  <Textarea
                    className="col-span-7"
                    rows={2}
                    placeholder="Short description"
                    value={w.description}
                    onChange={(e) => updateWork(i, { description: e.target.value })}
                  />
                  <Button type="button" size="icon" variant="ghost" className="col-span-1" onClick={() => removeWork(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Deliverables</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={processDeliverables} disabled={processingDeliverables}>
                    {processingDeliverables ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Process Deliverables with AI
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addDeliverable}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                  {deliverablesDirty && (
                    <Button type="button" size="sm" onClick={saveDeliverables}>Save</Button>
                  )}
                </div>
              </div>
              {deliverablesDirty && (
                <p className="text-xs text-primary">AI suggestions applied — review and Save.</p>
              )}
              {effectiveDeliverables.length === 0 && <p className="text-xs text-muted-foreground">No deliverables yet.</p>}
              {effectiveDeliverables.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <Input
                    className="col-span-4"
                    placeholder="Name"
                    value={d.name}
                    onChange={(e) => updateDeliverable(i, { name: e.target.value })}
                  />
                  <Textarea
                    className="col-span-7"
                    rows={2}
                    placeholder="Short description"
                    value={d.description}
                    onChange={(e) => updateDeliverable(i, { description: e.target.value })}
                  />
                  <Button type="button" size="icon" variant="ghost" className="col-span-1" onClick={() => removeDeliverable(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Milestones</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={processMilestones} disabled={processingMilestones}>
                    {processingMilestones ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Process Milestones with AI
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addMilestone}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                  {milestonesDirty && (
                    <Button type="button" size="sm" onClick={saveMilestones}>
                      Save
                    </Button>
                  )}
                </div>
              </div>
              {milestonesDirty && (
                <p className="text-xs text-primary">AI suggestions applied — review and Save.</p>
              )}
              {effectiveMilestones.length === 0 && <p className="text-xs text-muted-foreground">No milestones yet.</p>}
              {effectiveMilestones.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <Input
                    className="col-span-3"
                    placeholder="Milestone name"
                    value={m.name}
                    onChange={(e) => updateMilestone(i, { name: e.target.value })}
                  />
                  <Textarea
                    className="col-span-6"
                    rows={2}
                    placeholder="Description"
                    value={m.description}
                    onChange={(e) => updateMilestone(i, { description: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="date"
                    value={m.target_date}
                    onChange={(e) => updateMilestone(i, { target_date: e.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="col-span-1"
                    onClick={() => removeMilestone(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ===== Rate & Billing Terms ===== */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Rate &amp; Billing Terms</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hourly Rate (USD)</Label>
              <Input
                type="number"
                value={local.hourly_rate}
                onChange={(e) => save({ hourly_rate: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Also used on the Invoice tab.</p>
            </div>
            <div>
              <Label>Expense Pre-Approval Threshold (USD)</Label>
              <Input
                type="number"
                value={(local as any).sow_expense_threshold ?? 250}
                onChange={(e) => save({ sow_expense_threshold: Number(e.target.value) || 0 } as any)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Estimated Hours (min)</Label>
                <Button type="button" size="sm" variant="outline" onClick={processHours} disabled={processingHours}>
                  {processingHours ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  Process Estimated Hours with AI
                </Button>
              </div>
              <Input
                type="number"
                value={(local as any).sow_estimated_hours_min ?? ''}
                onChange={(e) => save({ sow_estimated_hours_min: e.target.value ? Number(e.target.value) : null } as any)}
              />
              <p className="text-xs text-muted-foreground mt-1">For planning only — not a cap.</p>
            </div>
            <div>
              <Label>Estimated Hours (max)</Label>
              <Input
                type="number"
                value={(local as any).sow_estimated_hours_max ?? ''}
                onChange={(e) => save({ sow_estimated_hours_max: e.target.value ? Number(e.target.value) : null } as any)}
              />
              <p className="text-xs text-muted-foreground mt-1">For planning only — not a cap.</p>
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch
                checked={!!(local as any).sow_nte_enabled}
                onCheckedChange={(v) => save({ sow_nte_enabled: v } as any)}
              />
              <Label>Not-to-Exceed Cap</Label>
              {(local as any).sow_nte_enabled && (
                <Input
                  type="number"
                  className="max-w-xs"
                  placeholder="Cap amount (USD)"
                  value={(local as any).sow_nte_amount ?? ''}
                  onChange={(e) => save({ sow_nte_amount: e.target.value ? Number(e.target.value) : null } as any)}
                />
              )}
            </div>
            <div>
              <Label>Invoicing Cadence</Label>
              <Select
                value={(local as any).sow_invoicing_cadence ?? ''}
                onValueChange={(v) => save({ sow_invoicing_cadence: v } as any)}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice Terms</Label>
              <Select
                value={(local as any).sow_invoice_terms ?? ''}
                onValueChange={(v) => save({ sow_invoice_terms: v } as any)}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="net15">Net 15</SelectItem>
                  <SelectItem value="net30">Net 30</SelectItem>
                  <SelectItem value="net45">Net 45</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ===== Signatures ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Signatures</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  save({
                    sow_signature_provider_company: 'Red Loft Consulting',
                    sow_signature_provider_name: local.redloft_contact_name ?? '',
                    sow_signature_provider_title: local.redloft_contact_title ?? '',
                    sow_signature_client_company: (local as any).snapshot_account_name ?? (local as any).snapshot_project_name ?? '',
                    sow_signature_client_name: local.snapshot_contact_name ?? '',
                    sow_signature_client_title: '',
                  } as any)
                }
              >
                Reset to defaults
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provider</p>
              <div>
                <Label>Company</Label>
                <Input
                  value={(local as any).sow_signature_provider_company ?? 'Red Loft Consulting'}
                  onChange={(e) => save({ sow_signature_provider_company: e.target.value } as any)}
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={(local as any).sow_signature_provider_name ?? local.redloft_contact_name ?? ''}
                  onChange={(e) => save({ sow_signature_provider_name: e.target.value } as any)}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={(local as any).sow_signature_provider_title ?? local.redloft_contact_title ?? ''}
                  onChange={(e) => save({ sow_signature_provider_title: e.target.value } as any)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
              <div>
                <Label>Company</Label>
                <Input
                  value={(local as any).sow_signature_client_company ?? (local as any).snapshot_account_name ?? (local as any).snapshot_project_name ?? ''}
                  onChange={(e) => save({ sow_signature_client_company: e.target.value } as any)}
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={(local as any).sow_signature_client_name ?? local.snapshot_contact_name ?? ''}
                  onChange={(e) => save({ sow_signature_client_name: e.target.value } as any)}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={(local as any).sow_signature_client_title ?? ''}
                  onChange={(e) => save({ sow_signature_client_title: e.target.value } as any)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isRedLoft && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Location Research</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!(local as any).sow_include_research}
                  onCheckedChange={(v) => save({ sow_include_research: v } as any)}
                  disabled={!dealResearch}
                />
                <Label>Include Location Research in SOW</Label>
              </div>
              {dealResearch ? (
                <p className="text-xs text-muted-foreground">
                  Latest research: {dealResearch.community_name || 'Untitled'} — saved {new Date(dealResearch.created_at).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No research saved to this opportunity yet. Use Research → Share to Opportunity.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                When enabled, the research summary is appended as an appendix after the Signatures section.
              </p>
            </CardContent>
          </Card>
        )}

          </TabsContent>

          <TabsContent value="invoice" className="space-y-6 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => nav(`/quotes/${local.id}/preview?doc=invoice`)}>
                <Printer className="mr-2 h-4 w-4" /> Generate Invoice PDF
              </Button>
            </div>
            {renderLaborCard()}
            {renderContractorCard()}
            {renderDiscountCard()}
            {renderTotalsCard()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-6">
          <Button onClick={() => {
            const { id: _id, created_at, updated_at, version_number, workspace_id, deals, contacts, ...patch } = local as any;
            updateQuote({ id: local.id, patch });
            toast({ title: 'Quote saved' });
          }}>
            Save
          </Button>
        </div>
      </div>
    </AppLayout>
  );

  function renderLaborCard() {
    return (
      <Card>
          <CardHeader><CardTitle className="text-sm">Labor Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                value={local!.hourly_rate}
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
              {visiblePhases.map((p) => {
                const hours = Number(local![p.key]) || 0;
                const lineTotal = hours * (Number(local!.hourly_rate) || 0);
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
                            value={local!.phase_revisions_rounds}
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
                    <div className="col-span-2 text-muted-foreground">{formatMoney(Number(local!.hourly_rate) || 0)}</div>
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
    );
  }

  function renderContractorCard() {
    return (
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
                {items.map((it) => {
                  const split = CONTRACTOR_SPLIT_LABELS[it.contractor_type];
                  return (
                    <div key={it.id} className="border rounded p-2 space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">Type</Label>
                          <Select value={it.contractor_type} onValueChange={(v) => {
                            const nextSplit = CONTRACTOR_SPLIT_LABELS[v];
                            const patch: any = { contractor_type: v };
                            if (!nextSplit) {
                              patch.design_fee = 0;
                              patch.shipping_fee = 0;
                            }
                            updateItem({ id: it.id, patch });
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CONTRACTOR_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs">Vendor (internal)</Label>
                          <Input
                            defaultValue={it.vendor_name ?? ''}
                            onBlur={(e) => updateItem({ id: it.id, patch: { vendor_name: e.target.value } })}
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
                      {split ? (
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label className="text-xs">{split.design}</Label>
                            <Input
                              key={`d-${it.id}-${it.design_fee}`}
                              type="number"
                              defaultValue={it.design_fee}
                              onBlur={(e) => {
                                const design = Number(e.target.value) || 0;
                                updateItem({ id: it.id, patch: { design_fee: design, flat_fee: design + (Number(it.shipping_fee) || 0) } });
                              }}
                            />
                          </div>
                          <div className="col-span-4">
                            <Label className="text-xs">{split.shipping}</Label>
                            <Input
                              key={`s-${it.id}-${it.shipping_fee}`}
                              type="number"
                              defaultValue={it.shipping_fee}
                              onBlur={(e) => {
                                const shipping = Number(e.target.value) || 0;
                                updateItem({ id: it.id, patch: { shipping_fee: shipping, flat_fee: (Number(it.design_fee) || 0) + shipping } });
                              }}
                            />
                          </div>
                          <div className="col-span-4">
                            <Label className="text-xs">Total (auto)</Label>
                            <Input type="number" value={it.flat_fee} readOnly className="bg-muted/40" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label className="text-xs">Total</Label>
                            <Input
                              type="number"
                              defaultValue={it.flat_fee}
                              onBlur={(e) => updateItem({ id: it.id, patch: { flat_fee: Number(e.target.value) || 0 } })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex justify-end pt-2 text-sm">
                  <span className="font-medium">Contractor Subtotal:&nbsp;</span>
                  {formatMoney(contractors)}
                </div>
              </div>
            )}
          </CardContent>
      </Card>
    );
  }

  function renderDiscountCard() {
    return (
      <Card>
          <CardHeader><CardTitle className="text-sm">Discount (applies to Labor only)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={local!.discount_type ?? 'none'} onValueChange={(v) => save({ discount_type: v === 'none' ? null : v })}>
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
                value={local!.discount_value}
                onChange={(e) => save({ discount_value: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <Label>Reason (internal)</Label>
              <Input
                value={local!.discount_reason ?? ''}
                onChange={(e) => save({ discount_reason: e.target.value })}
              />
            </div>
            <div className="col-span-4 flex items-center gap-2">
              <Switch
                checked={local!.include_discount_reason_on_pdf}
                onCheckedChange={(v) => save({ include_discount_reason_on_pdf: v })}
              />
              <Label>Show discount reason on client PDF</Label>
            </div>
          </CardContent>
      </Card>
    );
  }

  function renderTotalsCard() {
    return (
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
    );
  }
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